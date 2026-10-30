import bcrypt from "bcryptjs";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { SITES } from "../../src/data/constants.js";
import { createMailer } from "./email.js";
import {
  hashToken,
  createToken,
  escapeHtml,
  matchesTipDomain,
} from "./security.js";
import { getVisibleState, performAction } from "./state-store.js";

const COOKIE = "tipped_session";
const ACTIONS = new Set([
  "SUBMIT",
  "MODERATE",
  "PHOTO",
  "RECEIVE",
  "CLAIM",
  "CLAIM_DECIDE",
  "RELEASE",
  "RECOVER",
  "READ_NOTIFICATIONS",
]);
const registrationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128),
  number: z.string().trim().min(1).max(40),
  program: z.string().trim().min(1).max(120),
  site: z.enum(SITES),
});
const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
  role: z.enum(["student", "osa"]),
});
const tokenSchema = z.object({ token: z.string().min(32).max(128) });
const reporterSchema = z
  .object({
    type: z.enum(["affiliate", "visitor"]),
    name: z.string().trim().min(2).max(100),
    phone: z.string().regex(/^\d{11}$/),
    email: z.string().trim().email().max(254),
    number: z.string().trim().max(40).optional(),
    department: z.string().trim().max(120).optional(),
    purpose: z.string().trim().max(300).optional(),
    company: z.string().trim().max(120).optional(),
    year: z.string().trim().max(40).optional(),
  })
  .superRefine((reporter, context) => {
    if (reporter.type === "affiliate") {
      if (!reporter.number) {
        context.addIssue({
          code: "custom",
          path: ["number"],
          message: "Enter your school or faculty ID.",
        });
      }
      if (!reporter.department) {
        context.addIssue({
          code: "custom",
          path: ["department"],
          message: "Enter your department or office.",
        });
      }
    }
    if (reporter.type === "visitor" && !reporter.purpose?.trim()) {
      context.addIssue({
        code: "custom",
        path: ["purpose"],
        message: "Enter your purpose of visit.",
      });
    }
  });

function validateImageData(value, label) {
  if (value === undefined || value === "") return;
  if (typeof value !== "string")
    throw appError(400, `${label} must be an image.`);
  const match =
    /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]*={0,2})$/i.exec(value);
  if (!match)
    throw appError(400, `${label} must be a JPEG, PNG or WebP image.`);
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > 5 * 1024 * 1024 || bytes.toString("base64") !== match[2]) {
    throw appError(400, `${label} must be at most 5 MB and correctly encoded.`);
  }
  const mime = match[1].toLowerCase();
  const validSignature =
    (mime === "jpeg" &&
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff) ||
    (mime === "png" &&
      bytes.length >= 8 &&
      bytes
        .subarray(0, 8)
        .equals(
          Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        )) ||
    (mime === "webp" &&
      bytes.length >= 12 &&
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP");
  if (!validSignature)
    throw appError(400, `${label} file does not match its image type.`);
}

function validateActionPayload(type, payload, actor) {
  if (type === "SUBMIT") {
    validateImageData(payload.image, "Report photo");
    if (actor.role === "guest" && !payload.reporter)
      throw appError(
        400,
        "Guest reports need contact details for secure tracking.",
      );
    if (payload.reporter) {
      const reporter = reporterSchema.safeParse(payload.reporter);
      if (!reporter.success)
        throw appError(400, reporter.error.issues[0].message);
      payload.reporter = {
        ...reporter.data,
        email: reporter.data.email.toLowerCase(),
      };
    }
  }
  if (type === "CLAIM") validateImageData(payload.evidence, "Claim evidence");
}

function cookieOptions(config, maxAge) {
  return {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: "lax",
    path: "/api",
    maxAge,
  };
}

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    number: row.student_number || "",
    program: row.program || "",
    site: row.site || "",
    sites: row.sites || [],
  };
}

function appError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function sendError(res, error) {
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({
    error:
      status >= 500
        ? "The request could not be completed. Please try again later."
        : error.message,
  });
}

async function issueSession(pool, res, config, actor) {
  const token = createToken();
  const expiresAt = new Date(Date.now() + config.SESSION_TTL_DAYS * 86400000);
  await pool.query(
    "INSERT INTO sessions (token_hash, actor_id, role, expires_at) VALUES ($1, $2, $3, $4)",
    [hashToken(token), actor.id, actor.role, expiresAt],
  );
  res.cookie(
    COOKIE,
    token,
    cookieOptions(config, config.SESSION_TTL_DAYS * 86400000),
  );
}

async function issueEmailToken(pool, userId, purpose) {
  const token = createToken();
  await pool.query(
    `INSERT INTO email_tokens (token_hash, user_id, purpose, expires_at)
     VALUES ($1, $2, $3, now() + interval '1 hour')`,
    [hashToken(token), userId, purpose],
  );
  return token;
}

function emailHtml(title, link, explanation) {
  return `<h1>${escapeHtml(title)}</h1><p>${escapeHtml(explanation)}</p><p><a href="${escapeHtml(link)}">Continue</a></p><p>If you did not request this, you can ignore this message.</p>`;
}

export function createApp({ pool, config, mailer = createMailer(config) }) {
  const app = express();
  const api = express.Router();
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  });
  const actionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  });

  app.disable("x-powered-by");
  if (config.TRUST_PROXY) app.set("trust proxy", 1);
  app.use(helmet());
  app.use(express.json({ limit: "8mb", strict: true }));
  app.use((req, _res, next) => {
    req.cookies = {};
    for (const item of (req.headers.cookie || "").split(";")) {
      const separator = item.indexOf("=");
      if (separator < 0) continue;
      const name = item.slice(0, separator).trim();
      try {
        req.cookies[name] = decodeURIComponent(
          item.slice(separator + 1).trim(),
        );
      } catch {
        req.cookies[name] = "";
      }
    }
    next();
  });
  app.use((req, res, next) => {
    if (
      req.path.startsWith("/api/") &&
      !["GET", "HEAD", "OPTIONS"].includes(req.method)
    ) {
      if (
        req.get("x-tipped-request") !== "1" ||
        (req.get("origin") &&
          req.get("origin") !== new URL(config.APP_ORIGIN).origin)
      ) {
        return res
          .status(403)
          .json({ error: "Request origin could not be verified." });
      }
    }
    next();
  });

  api.get("/health", async (_req, res, next) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "ok" });
    } catch (error) {
      next(error);
    }
  });

  api.use(async (req, _res, next) => {
    try {
      const token = req.cookies?.[COOKIE];
      if (!token) return next();
      const result = await pool.query(
        `SELECT actor_id, role FROM sessions
         WHERE token_hash = $1 AND expires_at > now()`,
        [hashToken(token)],
      );
      const session = result.rows[0];
      if (!session) return next();
      if (session.role === "guest") {
        req.actor = {
          id: session.actor_id,
          role: "guest",
          name: "Guest",
          sites: [],
        };
        return next();
      }
      const userResult = await pool.query(
        `SELECT id, email, name, role, student_number, program, site, sites,
                email_verified_at, is_active
         FROM users WHERE id = $1`,
        [session.actor_id],
      );
      const user = userResult.rows[0];
      if (
        user?.is_active &&
        user.email_verified_at &&
        user.role === session.role
      ) {
        req.actor = publicUser(user);
      }
      next();
    } catch (error) {
      next(error);
    }
  });

  api.post("/auth/register", authLimiter, async (req, res, next) => {
    try {
      const input = registrationSchema.parse(req.body);
      const email = input.email.toLowerCase();
      if (
        config.tipEmailDomains.length === 0 ||
        !matchesTipDomain(email, config.tipEmailDomains)
      ) {
        throw appError(
          400,
          "Use an email address from an approved TIP domain.",
        );
      }
      const passwordHash = await bcrypt.hash(input.password, 12);
      const client = await pool.connect();
      let token;
      try {
        await client.query("BEGIN");
        const result = await client.query(
          `INSERT INTO users (id, email, name, password_hash, role, student_number,
                              program, site, email_verified_at)
           VALUES ($1, $2, $3, $4, 'student', $5, $6, $7, NULL)
           ON CONFLICT (email) DO NOTHING RETURNING id`,
          [
            randomUUID(),
            email,
            input.name,
            passwordHash,
            input.number,
            input.program,
            input.site,
          ],
        );
        if (!result.rowCount)
          throw appError(409, "An account already exists for this email.");
        token = createToken();
        await client.query(
          `INSERT INTO email_tokens (token_hash, user_id, purpose, expires_at)
           VALUES ($1, $2, 'verify_email', now() + interval '1 hour')`,
          [hashToken(token), result.rows[0].id],
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      } finally {
        client.release();
      }
      const link = `${config.APP_ORIGIN}/verify-email?token=${encodeURIComponent(token)}`;
      try {
        await mailer.send({
          to: email,
          subject: "Verify your TIPPED account",
          text: `Verify your account: ${link}`,
          html: emailHtml(
            "Verify your TIPPED account",
            link,
            "Confirm your email address to activate your account.",
          ),
        });
      } catch (error) {
        console.error(
          "Verification email delivery failed.",
          error instanceof Error && "code" in error
            ? error.code
            : "transport error",
        );
        return res.status(503).json({
          error:
            "Your account was created, but the verification email could not be sent. Use Resend verification to try again.",
          accountCreated: true,
        });
      }
      res
        .status(202)
        .json({ message: "Check your email to verify your account." });
    } catch (error) {
      if (error instanceof z.ZodError)
        return res.status(400).json({ error: error.issues[0].message });
      if (error.code === "23505")
        return res
          .status(409)
          .json({ error: "An account already exists for this email." });
      next(error);
    }
  });

  api.post("/auth/verify-email", authLimiter, async (req, res, next) => {
    const client = await pool.connect();
    try {
      const { token } = tokenSchema.parse(req.body);
      await client.query("BEGIN");
      const result = await client.query(
        `SELECT user_id FROM email_tokens
         WHERE token_hash = $1 AND purpose = 'verify_email'
           AND used_at IS NULL AND expires_at > now() FOR UPDATE`,
        [hashToken(token)],
      );
      if (!result.rowCount)
        throw appError(400, "This verification link is invalid or expired.");
      await client.query(
        "UPDATE users SET email_verified_at = now() WHERE id = $1",
        [result.rows[0].user_id],
      );
      await client.query(
        "UPDATE email_tokens SET used_at = now() WHERE token_hash = $1",
        [hashToken(token)],
      );
      await client.query("COMMIT");
      res.json({ message: "Email verified. You can now sign in." });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      if (error instanceof z.ZodError)
        return res.status(400).json({ error: error.issues[0].message });
      next(error);
    } finally {
      client.release();
    }
  });

  api.post("/auth/resend-verification", authLimiter, async (req, res, next) => {
    try {
      const email = z.string().email().parse(req.body?.email).toLowerCase();
      const result = await pool.query(
        "SELECT id FROM users WHERE email = $1 AND role = 'student' AND email_verified_at IS NULL AND is_active",
        [email],
      );
      if (!result.rowCount)
        return res.json({
          message: "If the account needs verification, an email will be sent.",
        });
      const token = await issueEmailToken(
        pool,
        result.rows[0].id,
        "verify_email",
      );
      const link = `${config.APP_ORIGIN}/verify-email?token=${encodeURIComponent(token)}`;
      await mailer.send({
        to: email,
        subject: "Verify your TIPPED account",
        text: `Verify your account: ${link}`,
        html: emailHtml(
          "Verify your TIPPED account",
          link,
          "Confirm your email address to activate your account.",
        ),
      });
      res.json({
        message: "If the account needs verification, an email will be sent.",
      });
    } catch (error) {
      if (error instanceof z.ZodError)
        return res.status(400).json({ error: "Enter a valid email address." });
      next(error);
    }
  });

  api.post("/auth/login", authLimiter, async (req, res, next) => {
    try {
      const input = loginSchema.parse(req.body);
      const result = await pool.query(
        `SELECT id, email, name, password_hash, role, student_number, program,
                site, sites, email_verified_at, is_active
         FROM users WHERE email = $1 AND role = $2`,
        [input.email.toLowerCase(), input.role],
      );
      const user = result.rows[0];
      if (!user || !(await bcrypt.compare(input.password, user.password_hash)))
        throw appError(
          401,
          "Check your email and password for the selected account type.",
        );
      if (!user.is_active)
        throw appError(
          403,
          "This account is disabled. Contact an administrator.",
        );
      if (!user.email_verified_at)
        throw appError(403, "Verify your email before signing in.");
      await issueSession(pool, res, config, { id: user.id, role: user.role });
      res.json({ user: publicUser(user) });
    } catch (error) {
      if (error instanceof z.ZodError)
        return res.status(400).json({ error: error.issues[0].message });
      next(error);
    }
  });

  api.post("/auth/guest", authLimiter, async (_req, res, next) => {
    try {
      const actor = { id: `guest-${randomUUID()}`, role: "guest" };
      await issueSession(pool, res, config, actor);
      res.json({ user: { ...actor, name: "Guest", sites: [] } });
    } catch (error) {
      next(error);
    }
  });

  api.post("/auth/guest-track", authLimiter, async (req, res, next) => {
    try {
      const { token } = tokenSchema.parse(req.body);
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await client.query(
          `SELECT guest_id FROM guest_track_tokens
           WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
           FOR UPDATE`,
          [hashToken(token)],
        );
        if (!result.rowCount)
          throw appError(
            400,
            "This tracking link is invalid, expired or already used.",
          );
        const guestId = result.rows[0].guest_id;
        const sessionToken = createToken();
        const expiresAt = new Date(
          Date.now() + config.SESSION_TTL_DAYS * 86400000,
        );
        await client.query(
          "INSERT INTO sessions (token_hash, actor_id, role, expires_at) VALUES ($1, $2, 'guest', $3)",
          [hashToken(sessionToken), guestId, expiresAt],
        );
        await client.query(
          "UPDATE guest_track_tokens SET used_at = now() WHERE token_hash = $1",
          [hashToken(token)],
        );
        await client.query("COMMIT");
        res.cookie(
          COOKIE,
          sessionToken,
          cookieOptions(config, config.SESSION_TTL_DAYS * 86400000),
        );
        res.json({
          user: {
            id: guestId,
            role: "guest",
            name: "Guest",
            sites: [],
          },
        });
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      if (error instanceof z.ZodError)
        return res.status(400).json({ error: error.issues[0].message });
      next(error);
    }
  });

  api.post("/auth/logout", async (req, res, next) => {
    try {
      const token = req.cookies?.[COOKIE];
      if (token)
        await pool.query("DELETE FROM sessions WHERE token_hash = $1", [
          hashToken(token),
        ]);
      res.clearCookie(COOKIE, cookieOptions(config, 0));
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  api.get("/auth/me", (req, res) => {
    res.json({ user: req.actor || null });
  });

  api.post(
    "/auth/password-reset/request",
    authLimiter,
    async (req, res, next) => {
      try {
        const email = z.string().email().parse(req.body?.email).toLowerCase();
        const result = await pool.query(
          "SELECT id FROM users WHERE email = $1 AND is_active",
          [email],
        );
        if (result.rowCount) {
          const token = await issueEmailToken(
            pool,
            result.rows[0].id,
            "password_reset",
          );
          const link = `${config.APP_ORIGIN}/reset-password?token=${encodeURIComponent(token)}`;
          await mailer.send({
            to: email,
            subject: "Reset your TIPPED password",
            text: `Reset your password: ${link}`,
            html: emailHtml(
              "Reset your TIPPED password",
              link,
              "Use this link to choose a new password. It expires in one hour.",
            ),
          });
        }
        res.json({
          message:
            "If an active account exists, a password reset email will be sent.",
        });
      } catch (error) {
        if (error instanceof z.ZodError)
          return res
            .status(400)
            .json({ error: "Enter a valid email address." });
        next(error);
      }
    },
  );

  api.post(
    "/auth/password-reset/complete",
    authLimiter,
    async (req, res, next) => {
      const client = await pool.connect();
      try {
        const input = z
          .object({
            token: z.string().min(32).max(128),
            password: z.string().min(12).max(128),
          })
          .parse(req.body);
        await client.query("BEGIN");
        const result = await client.query(
          `SELECT user_id FROM email_tokens
         WHERE token_hash = $1 AND purpose = 'password_reset'
           AND used_at IS NULL AND expires_at > now() FOR UPDATE`,
          [hashToken(input.token)],
        );
        if (!result.rowCount)
          throw appError(400, "This reset link is invalid or expired.");
        const passwordHash = await bcrypt.hash(input.password, 12);
        const userId = result.rows[0].user_id;
        await client.query(
          "UPDATE users SET password_hash = $1 WHERE id = $2",
          [passwordHash, userId],
        );
        await client.query(
          "UPDATE email_tokens SET used_at = now() WHERE user_id = $1 AND purpose = 'password_reset' AND used_at IS NULL",
          [userId],
        );
        await client.query("DELETE FROM sessions WHERE actor_id = $1", [
          userId,
        ]);
        await client.query("COMMIT");
        res.json({
          message: "Password updated. Sign in with your new password.",
        });
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        if (error instanceof z.ZodError)
          return res.status(400).json({ error: error.issues[0].message });
        next(error);
      } finally {
        client.release();
      }
    },
  );

  api.get("/state", async (req, res, next) => {
    try {
      if (!req.actor) throw appError(401, "Sign in to continue.");
      res.json(await getVisibleState(pool, req.actor));
    } catch (error) {
      next(error);
    }
  });

  api.post("/actions", actionLimiter, async (req, res, next) => {
    try {
      if (!req.actor) throw appError(401, "Sign in to continue.");
      const input = z
        .object({
          type: z.string().min(1),
          payload: z.record(z.string(), z.unknown()).default({}),
        })
        .parse(req.body);
      if (!ACTIONS.has(input.type)) throw appError(400, "Unknown action.");
      validateActionPayload(input.type, input.payload, req.actor);
      const result = await performAction(
        pool,
        req.actor,
        input.type,
        input.payload,
      );
      let emailNotice = "";
      if (
        input.type === "SUBMIT" &&
        req.actor.role === "guest" &&
        input.payload.reporter?.email
      ) {
        try {
          const trackToken = createToken();
          await pool.query(
            `INSERT INTO guest_track_tokens (token_hash, guest_id, report_id, email, expires_at)
             VALUES ($1, $2, $3, $4, now() + interval '7 days')`,
            [
              hashToken(trackToken),
              req.actor.id,
              result.result,
              input.payload.reporter.email,
            ],
          );
          const link = `${config.APP_ORIGIN}/guest-track?token=${encodeURIComponent(trackToken)}`;
          await mailer.send({
            to: input.payload.reporter.email,
            subject: "Track your TIPPED report",
            text: `Use this one-time link to securely follow report ${result.result}: ${link}`,
            html: emailHtml(
              "Track your TIPPED report",
              link,
              "This private one-time link expires in seven days.",
            ),
          });
        } catch (error) {
          console.error(
            "Guest tracking link delivery failed.",
            error instanceof Error && "code" in error
              ? error.code
              : "transport error",
          );
          emailNotice =
            "Your report was saved, but its secure tracking link could not be sent. Contact OSA to follow up.";
        }
      }
      res.json({
        result: result.result,
        state: await getVisibleState(pool, req.actor),
        emailNotice,
      });
    } catch (error) {
      if (error instanceof z.ZodError)
        return res.status(400).json({ error: error.issues[0].message });
      next(error);
    }
  });

  api.use((_req, res) => {
    res.status(404).json({ error: "API endpoint not found." });
  });

  app.use("/api", api);
  if (config.NODE_ENV === "production") {
    const frontend = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../dist",
    );
    app.use(express.static(frontend, { index: false, maxAge: "1h" }));
    app.use((req, res, next) => {
      if (req.method !== "GET") return next();
      res.sendFile(path.join(frontend, "index.html"), (error) => {
        if (error) next(error);
      });
    });
  }
  app.use((error, _req, res, _next) => sendError(res, error));
  return app;
}
