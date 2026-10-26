import { z } from "zod";

const optionalString = z.string().trim().optional().default("");

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  API_PORT: z.coerce.number().int().min(1).max(65535).optional(),
  PORT: z.coerce.number().int().min(1).max(65535).optional(),
  DATABASE_URL: z.string().trim().min(1, "DATABASE_URL is required."),
  DATABASE_SSL: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  APP_ORIGIN: z.string().url().default("http://127.0.0.1:5173"),
  TIP_EMAIL_DOMAINS: optionalString,
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(30).default(14),
  SMTP_HOST: optionalString,
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).optional().default(587),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  SMTP_USER: optionalString,
  SMTP_PASSWORD: optionalString,
  EMAIL_FROM: optionalString,
  TRUST_PROXY: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export function readConfig(env = process.env) {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid server configuration: ${details}`);
  }

  const config = parsed.data;
  const appUrl = new URL(config.APP_ORIGIN);
  if (appUrl.pathname !== "/" || appUrl.search || appUrl.hash)
    throw new Error("APP_ORIGIN must be an origin without a path or query.");
  const tipEmailDomains = config.TIP_EMAIL_DOMAINS.split(",")
    .map((domain) => domain.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
  if (
    tipEmailDomains.some(
      (domain) =>
        !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(
          domain,
        ),
    )
  ) {
    throw new Error(
      "TIP_EMAIL_DOMAINS must be a comma-separated list of valid domains.",
    );
  }
  const emailConfigured = Boolean(
    config.SMTP_HOST &&
    config.EMAIL_FROM &&
    config.SMTP_USER &&
    config.SMTP_PASSWORD,
  );
  if (config.NODE_ENV === "production") {
    if (appUrl.protocol !== "https:")
      throw new Error("APP_ORIGIN must use HTTPS in production.");
    if (!config.DATABASE_SSL)
      throw new Error("DATABASE_SSL=true is required in production.");
    if (!emailConfigured)
      throw new Error(
        "SMTP_HOST, SMTP_USER, SMTP_PASSWORD and EMAIL_FROM are required in production.",
      );
    if (!tipEmailDomains.length)
      throw new Error("TIP_EMAIL_DOMAINS must be configured in production.");
  }
  return {
    ...config,
    APP_ORIGIN: appUrl.origin,
    API_PORT: config.API_PORT || config.PORT || 3000,
    databaseSsl:
      config.NODE_ENV === "production" || config.DATABASE_SSL
        ? { rejectUnauthorized: true }
        : false,
    cookieSecure: config.NODE_ENV === "production",
    emailConfigured,
    tipEmailDomains,
  };
}
