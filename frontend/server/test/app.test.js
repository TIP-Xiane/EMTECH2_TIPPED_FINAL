import assert from "node:assert/strict";
import test from "node:test";
import { hashToken } from "../src/security.js";
import { createApp } from "../src/app.js";

test("API health, anonymous session lookup and write-origin protection", async (t) => {
  const sessions = new Map();
  const trackingTokens = new Map();
  const users = new Map();
  const emailTokens = new Map();
  const emptyCollections = new Map(
    [
      "reports",
      "claims",
      "receipts",
      "releases",
      "audit_events",
      "notifications",
    ].map((table) => [table, []]),
  );
  const pool = {
    async query(query, values = []) {
      if (query === "SELECT 1") return { rows: [{ value: 1 }], rowCount: 1 };
      if (query.startsWith("SELECT actor_id, role FROM sessions")) {
        const session = sessions.get(values[0]);
        return { rows: session ? [session] : [], rowCount: session ? 1 : 0 };
      }
      if (query.startsWith("INSERT INTO sessions")) {
        sessions.set(values[0], { actor_id: values[1], role: values[2] });
        return { rows: [], rowCount: 1 };
      }
      if (query.startsWith("DELETE FROM sessions")) {
        sessions.delete(values[0]);
        return { rows: [], rowCount: 1 };
      }
      if (query.startsWith("INSERT INTO guest_track_tokens")) {
        trackingTokens.set(values[0], {
          guest_id: values[1],
          report_id: values[2],
          email: values[3],
          used_at: null,
        });
        return { rows: [], rowCount: 1 };
      }
      if (query.startsWith("INSERT INTO email_tokens")) {
        emailTokens.set(values[0], {
          user_id: values[1],
          purpose: values[2],
          used_at: null,
        });
        return { rows: [], rowCount: 1 };
      }
      if (
        query.startsWith("SELECT id FROM users WHERE email = $1 AND is_active")
      ) {
        const user = [...users.values()].find(
          (item) => item.email === values[0] && item.is_active,
        );
        return { rows: user ? [{ id: user.id }] : [], rowCount: user ? 1 : 0 };
      }
      if (query.startsWith("SELECT id, email, name, password_hash")) {
        const user = [...users.values()].find(
          (item) => item.email === values[0] && item.role === values[1],
        );
        return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
      }
      if (query.startsWith("SELECT id, email, name, role, student_number")) {
        const user = users.get(values[0]);
        return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
      }
      throw new Error(`Unexpected pool query: ${query}`);
    },
    async connect() {
      return {
        async query(query, values = []) {
          const select =
            /^SELECT payload FROM ([a-z_]+) ORDER BY created_at DESC, id DESC$/.exec(
              query,
            );
          if (select) {
            return {
              rows: emptyCollections
                .get(select[1])
                .map((payload) => ({ payload })),
              rowCount: emptyCollections.get(select[1]).length,
            };
          }
          if (query.startsWith("INSERT INTO reports")) {
            const report = JSON.parse(values[7]);
            emptyCollections.get("reports").push(report);
            return { rows: [], rowCount: 1 };
          }
          if (query.startsWith("INSERT INTO sessions")) {
            sessions.set(values[0], {
              actor_id: values[1],
              role: query.includes("'guest'") ? "guest" : values[2],
            });
            return { rows: [], rowCount: 1 };
          }
          if (query.startsWith("INSERT INTO users")) {
            const user = {
              id: values[0],
              email: values[1],
              name: values[2],
              password_hash: values[3],
              role: "student",
              student_number: values[4],
              program: values[5],
              site: values[6],
              sites: [],
              email_verified_at: null,
              is_active: true,
            };
            if ([...users.values()].some((item) => item.email === user.email))
              return { rows: [], rowCount: 0 };
            users.set(user.id, user);
            return { rows: [{ id: user.id }], rowCount: 1 };
          }
          if (query.startsWith("INSERT INTO email_tokens")) {
            emailTokens.set(values[0], {
              user_id: values[1],
              purpose: query.includes("'verify_email'")
                ? "verify_email"
                : values[2],
              used_at: null,
            });
            return { rows: [], rowCount: 1 };
          }
          if (query.startsWith("SELECT user_id FROM email_tokens")) {
            const token = emailTokens.get(values[0]);
            const purpose = query.includes("purpose = 'verify_email'")
              ? "verify_email"
              : "password_reset";
            const valid = token && !token.used_at && token.purpose === purpose;
            return {
              rows: valid ? [{ user_id: token.user_id }] : [],
              rowCount: valid ? 1 : 0,
            };
          }
          if (query.startsWith("UPDATE users SET email_verified_at")) {
            const user = users.get(values[0]);
            if (user) user.email_verified_at = new Date().toISOString();
            return { rows: [], rowCount: user ? 1 : 0 };
          }
          if (query.startsWith("UPDATE email_tokens SET used_at")) {
            if (query.includes("WHERE user_id = $1")) {
              for (const token of emailTokens.values()) {
                if (
                  token.user_id === values[0] &&
                  token.purpose === "password_reset" &&
                  !token.used_at
                ) {
                  token.used_at = new Date().toISOString();
                }
              }
              return { rows: [], rowCount: 1 };
            }
            const token = emailTokens.get(values[0]);
            if (token) token.used_at = new Date().toISOString();
            return { rows: [], rowCount: token ? 1 : 0 };
          }
          if (query.startsWith("UPDATE users SET password_hash")) {
            const user = users.get(values[1]);
            if (user) user.password_hash = values[0];
            return { rows: [], rowCount: user ? 1 : 0 };
          }
          if (query.startsWith("DELETE FROM sessions WHERE actor_id")) {
            for (const [token, session] of sessions) {
              if (session.actor_id === values[0]) sessions.delete(token);
            }
            return { rows: [], rowCount: 1 };
          }
          if (query.startsWith("INSERT INTO audit_events")) {
            emptyCollections.get("audit_events").push(JSON.parse(values[3]));
            return { rows: [], rowCount: 1 };
          }
          if (query.startsWith("INSERT INTO notifications")) {
            emptyCollections.get("notifications").push(JSON.parse(values[5]));
            return { rows: [], rowCount: 1 };
          }
          if (
            query.startsWith("INSERT INTO claims") ||
            query.startsWith("INSERT INTO receipts") ||
            query.startsWith("INSERT INTO releases")
          ) {
            return { rows: [], rowCount: 1 };
          }
          if (query.startsWith("SELECT guest_id FROM guest_track_tokens")) {
            const token = trackingTokens.get(values[0]);
            return {
              rows:
                token && !token.used_at ? [{ guest_id: token.guest_id }] : [],
              rowCount: token && !token.used_at ? 1 : 0,
            };
          }
          if (query.startsWith("UPDATE guest_track_tokens")) {
            const token = trackingTokens.get(values[0]);
            if (token) token.used_at = new Date().toISOString();
            return { rows: [], rowCount: token ? 1 : 0 };
          }
          return { rows: [], rowCount: 0 };
        },
        release() {},
      };
    },
  };
  const config = {
    NODE_ENV: "test",
    APP_ORIGIN: "http://127.0.0.1:5173",
    SESSION_TTL_DAYS: 14,
    cookieSecure: false,
    emailConfigured: false,
    tipEmailDomains: ["example.com"],
    TRUST_PROXY: false,
  };
  const deliveredEmails = [];
  let failNextEmail = false;
  const server = createApp({
    pool,
    config,
    mailer: {
      async send(message) {
        if (failNextEmail) {
          failNextEmail = false;
          const error = new Error("Simulated SMTP failure");
          error.code = "ETIMEDOUT";
          throw error;
        }
        deliveredEmails.push(message);
      },
    },
  }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(
    () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  );
  const origin = `http://127.0.0.1:${server.address().port}`;

  const health = await fetch(`${origin}/api/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: "ok" });

  const session = await fetch(`${origin}/api/auth/me`);
  assert.equal(session.status, 200);
  assert.deepEqual(await session.json(), { user: null });

  const blocked = await fetch(`${origin}/api/actions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "READ_NOTIFICATIONS" }),
  });
  assert.equal(blocked.status, 403);

  const anonymous = await fetch(`${origin}/api/actions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-TIPPED-Request": "1",
      Origin: config.APP_ORIGIN,
    },
    body: JSON.stringify({ type: "READ_NOTIFICATIONS" }),
  });
  assert.equal(anonymous.status, 401);

  const guestResponse = await fetch(`${origin}/api/auth/guest`, {
    method: "POST",
    headers: {
      "X-TIPPED-Request": "1",
      Origin: config.APP_ORIGIN,
    },
  });
  assert.equal(guestResponse.status, 200);
  const guestUser = (await guestResponse.json()).user;
  assert.equal(guestUser.role, "guest");
  const setCookie = guestResponse.headers.get("set-cookie");
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Lax/i);
  const cookie = setCookie.split(";")[0];

  const state = await fetch(`${origin}/api/state`, {
    headers: { Cookie: cookie },
  });
  assert.equal(state.status, 200);
  assert.deepEqual(await state.json(), {
    reports: [],
    claims: [],
    receipts: [],
    releases: [],
    events: [],
    notifications: [],
  });

  const readAction = await fetch(`${origin}/api/actions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-TIPPED-Request": "1",
      Origin: config.APP_ORIGIN,
      Cookie: cookie,
    },
    body: JSON.stringify({ type: "READ_NOTIFICATIONS" }),
  });
  assert.equal(readAction.status, 200);

  const reportResponse = await fetch(`${origin}/api/actions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-TIPPED-Request": "1",
      Origin: config.APP_ORIGIN,
      Cookie: cookie,
    },
    body: JSON.stringify({
      type: "SUBMIT",
      payload: {
        type: "Found",
        title: "Blue bottle",
        category: "Personal Belongings",
        site: "Arlegui",
        location: "Library",
        itemDate: new Date().toISOString().slice(0, 10),
        description: "Blue bottle with a silver cap.",
        validDays: 4,
        reporter: {
          type: "visitor",
          name: "Test Visitor",
          phone: "12345678901",
          email: "visitor@example.com",
          purpose: "Visiting a student",
        },
      },
    }),
  });
  assert.equal(reportResponse.status, 200);
  const reportResult = await reportResponse.json();
  assert.equal(reportResult.state.reports.length, 1);
  assert.equal(reportResult.state.reports[0].reporterId, guestUser.id);
  assert.equal(deliveredEmails.length, 1);
  const trackingToken = /guest-track\?token=([A-Za-z0-9_-]+)/.exec(
    deliveredEmails[0].text,
  )[1];

  const trackedGuest = await fetch(`${origin}/api/auth/guest-track`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-TIPPED-Request": "1",
      Origin: config.APP_ORIGIN,
    },
    body: JSON.stringify({ token: trackingToken }),
  });
  assert.equal(trackedGuest.status, 200);
  assert.equal((await trackedGuest.json()).user.role, "guest");
  const trackedCookie = trackedGuest.headers.get("set-cookie").split(";")[0];
  const trackedState = await fetch(`${origin}/api/state`, {
    headers: { Cookie: trackedCookie },
  });
  assert.equal(trackedState.status, 200);
  assert.equal((await trackedState.json()).reports.length, 1);

  const reusedLink = await fetch(`${origin}/api/auth/guest-track`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-TIPPED-Request": "1",
      Origin: config.APP_ORIGIN,
    },
    body: JSON.stringify({ token: trackingToken }),
  });
  assert.equal(reusedLink.status, 400);

  failNextEmail = true;
  const savedWithoutEmail = await fetch(`${origin}/api/actions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-TIPPED-Request": "1",
      Origin: config.APP_ORIGIN,
      Cookie: cookie,
    },
    body: JSON.stringify({
      type: "SUBMIT",
      payload: {
        type: "Lost",
        title: "Red umbrella",
        category: "Personal Belongings",
        site: "Arlegui",
        location: "Main entrance",
        itemDate: new Date().toISOString().slice(0, 10),
        description: "A red umbrella with a wooden handle.",
        validDays: 4,
        reporter: {
          type: "visitor",
          name: "Test Visitor",
          phone: "12345678901",
          email: "visitor@example.com",
          purpose: "Visiting a student",
        },
      },
    }),
  });
  assert.equal(savedWithoutEmail.status, 200);
  const savedWithoutEmailResult = await savedWithoutEmail.json();
  assert.equal(savedWithoutEmailResult.state.reports.length, 2);
  assert.match(savedWithoutEmailResult.emailNotice, /report was saved/);

  const registration = await fetch(`${origin}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-TIPPED-Request": "1",
      Origin: config.APP_ORIGIN,
    },
    body: JSON.stringify({
      name: "Verified Student",
      email: "student@example.com",
      password: "LongEnoughPassword2026",
      number: "123456",
      program: "Engineering",
      site: "Arlegui",
    }),
  });
  assert.equal(registration.status, 202);
  const verificationToken = /verify-email\?token=([A-Za-z0-9_-]+)/.exec(
    deliveredEmails.at(-1).text,
  )[1];

  const verification = await fetch(`${origin}/api/auth/verify-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-TIPPED-Request": "1",
      Origin: config.APP_ORIGIN,
    },
    body: JSON.stringify({ token: verificationToken }),
  });
  assert.equal(verification.status, 200);
  assert.ok(emailTokens.has(hashToken(verificationToken)));

  const studentLogin = await fetch(`${origin}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-TIPPED-Request": "1",
      Origin: config.APP_ORIGIN,
    },
    body: JSON.stringify({
      email: "student@example.com",
      password: "LongEnoughPassword2026",
      role: "student",
    }),
  });
  assert.equal(studentLogin.status, 200);
  assert.equal((await studentLogin.json()).user.role, "student");
  assert.match(studentLogin.headers.get("set-cookie"), /HttpOnly/i);

  const passwordResetRequest = await fetch(
    `${origin}/api/auth/password-reset/request`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-TIPPED-Request": "1",
        Origin: config.APP_ORIGIN,
      },
      body: JSON.stringify({ email: "student@example.com" }),
    },
  );
  assert.equal(passwordResetRequest.status, 200);
  const resetToken = /reset-password\?token=([A-Za-z0-9_-]+)/.exec(
    deliveredEmails.at(-1).text,
  )[1];
  const resetPassword = await fetch(
    `${origin}/api/auth/password-reset/complete`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-TIPPED-Request": "1",
        Origin: config.APP_ORIGIN,
      },
      body: JSON.stringify({
        token: resetToken,
        password: "NewLongEnoughPassword2026",
      }),
    },
  );
  assert.equal(resetPassword.status, 200);
  const oldPasswordLogin = await fetch(`${origin}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-TIPPED-Request": "1",
      Origin: config.APP_ORIGIN,
    },
    body: JSON.stringify({
      email: "student@example.com",
      password: "LongEnoughPassword2026",
      role: "student",
    }),
  });
  assert.equal(oldPasswordLogin.status, 401);
  const newPasswordLogin = await fetch(`${origin}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-TIPPED-Request": "1",
      Origin: config.APP_ORIGIN,
    },
    body: JSON.stringify({
      email: "student@example.com",
      password: "NewLongEnoughPassword2026",
      role: "student",
    }),
  });
  assert.equal(newPasswordLogin.status, 200);
  const invalidImage = await fetch(`${origin}/api/actions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-TIPPED-Request": "1",
      Origin: config.APP_ORIGIN,
      Cookie: cookie,
    },
    body: JSON.stringify({
      type: "SUBMIT",
      payload: { image: "data:image/png;base64,not-an-image" },
    }),
  });
  assert.equal(invalidImage.status, 400);
});
