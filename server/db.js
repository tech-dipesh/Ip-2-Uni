import "dotenv/config";
import pg from "pg";
import { readdir, readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => console.error("[DB Pool Error]", err.message));

// Reads migration files in alphabetical order, skips already-ran ones
const runMigrations = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename TEXT PRIMARY KEY,
      ran_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const migrationsDir = join(__dirname, "db");
  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const { rows } = await client.query(
      "SELECT filename FROM _migrations WHERE filename = $1",
      [file]
    );
    if (rows.length) continue;

    const sql = await readFile(join(migrationsDir, file), "utf8");
    await client.query(sql);
    await client.query("INSERT INTO _migrations (filename) VALUES ($1)", [file]);
    console.log(`[DB] Migration ran: ${file}`);
  }
};

export const connectDB = async () => {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
    console.log("PostgreSQL connected");
    await runMigrations(client);
  } finally {
    client.release();
  }
};

export const query = async (text, params) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (err) {
    console.error("[DB Query Error]", err.message);
    throw err;
  }
};

// Use this for any multi-step writes that must succeed or fail together
export const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export default pool;