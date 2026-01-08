import { getPool } from "../config/db.pool.js";
import logger from "./logger.js";

export async function recordAudit({ user_id = null, action, details = null, affected_table_id = null, affected_table = null, ip_address = null }) {
  try {
    const p = getPool();
    await p.execute(
      "INSERT INTO AuditLog (user_id, action, `timestamp`, details, ip_address, affected_table_id, affected_table) VALUES (?,?,?,?,?,?,?)",
      [user_id, action, new Date(), details, ip_address, affected_table_id, affected_table]
    );
  } catch (err) {
    logger.warn("Failed to record audit log:", err.message);
  }
}
