import { createApp } from "./app.js";
import { readConfig } from "./config.js";
import { createPool } from "./db.js";

const config = readConfig();
const pool = createPool(config);
const app = createApp({ pool, config });
const server = app.listen(config.API_PORT, "0.0.0.0", () => {
  console.log(`TIPPED API listening on port ${config.API_PORT}.`);
});

async function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
