import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { getDbConfig } from "../config/db.config.js";
import logger from "../lib/logger.js";

dotenv.config();

async function run() {
  logger.log("Clearing data (truncate tables) for reseed...");
  const conn = await mysql.createConnection({ ...getDbConfig(), multipleStatements: true });
  try {
    await conn.beginTransaction();
    await conn.query("SET FOREIGN_KEY_CHECKS=0");
    const tables = [
      "TicketViolation",
      "Payment",
      "Ticket",
      "Vehicle",
      "Driver",
      "OfficerAssignment",
      "AuditLog",
      "BackupHistory",
      "SystemConfig",
      "ViolationType",
      "LGU",
      "User",
      "Role"
    ];
    for (const t of tables) {
      logger.info(`TRUNCATE ${t}`);
      await conn.query(`TRUNCATE TABLE \`${t}\``);
    }
    await conn.query("SET FOREIGN_KEY_CHECKS=1");
    await conn.commit();
    logger.success("Data cleared. You can now reseed.");
  } catch (err) {
    await conn.rollback();
    logger.error("Clear data failed:", err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

run();
