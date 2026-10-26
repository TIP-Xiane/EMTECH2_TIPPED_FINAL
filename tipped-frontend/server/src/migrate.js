import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createPool } from "./db.js";
import { readConfig } from "./config.js";

const config = readConfig();
const pool = createPool(config);
try {
  const migration = await readFile(
    fileURLToPath(new URL("../migrations/001_initial.sql", import.meta.url)),
    "utf8",
  );
  await pool.query(migration);
  console.log("Database migration completed.");
} finally {
  await pool.end();
}
