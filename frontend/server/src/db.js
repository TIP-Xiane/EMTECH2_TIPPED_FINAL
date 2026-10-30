import pg from "pg";

export function createPool(config) {
  return new pg.Pool({
    connectionString: config.DATABASE_URL,
    ssl: config.databaseSsl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    application_name: "tipped-api",
  });
}
