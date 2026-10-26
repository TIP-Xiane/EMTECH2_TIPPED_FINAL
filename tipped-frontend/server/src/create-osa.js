import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { createPool } from "./db.js";
import { readConfig } from "./config.js";

const config = readConfig();
const name = process.env.OSA_NAME?.trim();
const email = process.env.OSA_EMAIL?.trim().toLowerCase();
const password = process.env.OSA_PASSWORD;
const sites = (process.env.OSA_SITES || "")
  .split(",")
  .map((site) => site.trim())
  .filter(Boolean);

if (!name || !email || !password || !sites.length) {
  throw new Error(
    "Set OSA_NAME, OSA_EMAIL, OSA_PASSWORD and comma-separated OSA_SITES before provisioning.",
  );
}
if (password.length < 12) {
  throw new Error("OSA_PASSWORD must contain at least 12 characters.");
}
if (sites.some((site) => !["Arlegui", "Casal", "Other"].includes(site))) {
  throw new Error("OSA_SITES may contain Arlegui, Casal or Other.");
}

const pool = createPool(config);
try {
  const passwordHash = await bcrypt.hash(password, 12);
  const result = await pool.query(
    `INSERT INTO users (id, email, name, password_hash, role, sites, email_verified_at)
     VALUES ($1, $2, $3, $4, 'osa', $5, now())
     ON CONFLICT (email) DO NOTHING`,
    [randomUUID(), email, name, passwordHash, sites],
  );
  if (result.rowCount === 0) {
    throw new Error(
      "An account already uses that email; choose a dedicated OSA address.",
    );
  }
  console.log(`OSA account provisioned for ${email}.`);
} finally {
  await pool.end();
}
