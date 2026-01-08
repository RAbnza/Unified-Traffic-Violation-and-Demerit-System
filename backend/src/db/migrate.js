import fs from "fs";
import path from "path";
import url from "url";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { getDbConfig, getRootConnectionConfig } from "../config/db.config.js";
import logger from "../lib/logger.js";

dotenv.config();

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureDatabaseExists() {
  const rootConn = await mysql.createConnection({
    ...getRootConnectionConfig(),
    multipleStatements: true,
  });
  const dbName = getDbConfig().database;
  await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
  await rootConn.end();
}

async function withDbConnection(fn) {
  const conn = await mysql.createConnection({
    ...getDbConfig(),
    multipleStatements: true,
  });
  try {
    return await fn(conn);
  } finally {
    await conn.end();
  }
}

async function getAppliedMigrations(conn) {
  await conn.query(`CREATE TABLE IF NOT EXISTS _migrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  const [rows] = await conn.query("SELECT name FROM _migrations ORDER BY id ASC");
  return new Set(rows.map((r) => r.name));
}

async function applyMigration(conn, name, sql) {
  await conn.beginTransaction();
  try {
    await conn.query(sql);
    await conn.query("INSERT INTO _migrations (name) VALUES (?)", [name]);
    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  }
}

async function run() {
  logger.log("Starting DB migration...");
  await ensureDatabaseExists();

  const migrationsDir = path.join(__dirname, "migrations");
  if (!fs.existsSync(migrationsDir)) {
    logger.warn("No migrations directory found. Skipping.");
    return;
  }

  const allFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (allFiles.length === 0) {
    logger.warn("No migration files found. Nothing to do.");
    return;
  }

  await withDbConnection(async (conn) => {
    const applied = await getAppliedMigrations(conn);

    for (const file of allFiles) {
      if (applied.has(file)) {
        logger.info(`Already applied: ${file}`);
        continue;
      }
      const fullPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(fullPath, "utf8");
      process.stdout.write(formatApply(file));
      try {
        await applyMigration(conn, file, sql);
        logger.success(`Applied ${file}`);
      } catch (err) {
        logger.error("Error while applying", file, "-", err.message);
        process.exitCode = 1;
        throw err;
      }
    }
  });

  logger.success("Migrations complete.");
}

function formatApply(file) {
  // Keep a simple non-colored prefix for streaming status, then final success/error uses logger
  return `Applying ${file} ... `;
}

run().catch((err) => {
  logger.error(err);
  process.exit(1);
});
