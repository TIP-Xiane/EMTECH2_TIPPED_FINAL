import assert from "node:assert/strict";
import test from "node:test";
import { readConfig } from "../src/config.js";

const productionEnv = {
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://tipped:secret@db.example/tipped",
  DATABASE_SSL: "true",
  APP_ORIGIN: "https://tipped.example",
  TIP_EMAIL_DOMAINS: "@tip.edu.ph,students.tip.edu.ph",
  SMTP_HOST: "smtp.example",
  SMTP_PORT: "587",
  SMTP_SECURE: "false",
  SMTP_USER: "tipped@example",
  SMTP_PASSWORD: "not-a-real-password",
  EMAIL_FROM: "TIPPED <noreply@example>",
};

test("production config requires HTTPS, TLS database and complete SMTP/domain setup", () => {
  assert.throws(
    () => readConfig({ ...productionEnv, APP_ORIGIN: "http://tipped.example" }),
    /APP_ORIGIN must use HTTPS/,
  );
  assert.throws(
    () => readConfig({ ...productionEnv, DATABASE_SSL: "false" }),
    /DATABASE_SSL=true/,
  );
  assert.throws(
    () => readConfig({ ...productionEnv, SMTP_PASSWORD: "" }),
    /SMTP_HOST, SMTP_USER, SMTP_PASSWORD and EMAIL_FROM/,
  );
  assert.throws(
    () => readConfig({ ...productionEnv, TIP_EMAIL_DOMAINS: ", ," }),
    /TIP_EMAIL_DOMAINS must be configured/,
  );
});

test("production config normalizes exact TIP domains and requires trusted TLS", () => {
  const config = readConfig(productionEnv);
  assert.deepEqual(config.tipEmailDomains, [
    "tip.edu.ph",
    "students.tip.edu.ph",
  ]);
  assert.deepEqual(config.databaseSsl, { rejectUnauthorized: true });
  assert.equal(config.cookieSecure, true);
  assert.equal(config.emailConfigured, true);
});

test("hosting PORT is used when API_PORT is not provided", () => {
  const config = readConfig({
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://localhost/tipped",
    PORT: "8080",
  });
  assert.equal(config.API_PORT, 8080);
});

test("application origin cannot include a path", () => {
  assert.throws(
    () =>
      readConfig({
        ...productionEnv,
        APP_ORIGIN: "https://tipped.example/app",
      }),
    /origin without a path/,
  );
});
