import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { getRootConnectionConfig, getDbConfig } from "../config/db.config.js";
import logger from "../lib/logger.js";
import { execSync } from "child_process";

dotenv.config();

async function dropAndRecreateDatabase() {
  const dbName = getDbConfig().database;
  const conn = await mysql.createConnection({ ...getRootConnectionConfig(), multipleStatements: true });
  try {
    logger.warn(`Dropping database: ${dbName}`);
    await conn.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
    logger.info(`Creating database: ${dbName}`);
    await conn.query(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
  } finally {
    await conn.end();
  }
}

async function run() {
  logger.log("Resetting database (drop, migrate, seed)...");
  await dropAndRecreateDatabase();
  // Re-run migrations and seed
  execSync("node src/db/migrate.js", { stdio: "inherit" });
  execSync("node src/db/seed.js", { stdio: "inherit" });
  logger.success("Database reset complete.");
}

run().catch((err) => {
  logger.error("Reset failed:", err.message);
  process.exit(1);
});
