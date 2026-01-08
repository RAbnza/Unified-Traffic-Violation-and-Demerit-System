import { Router } from "express";
import asyncHandler from "../lib/asyncHandler.js";
import { getPool } from "../config/db.pool.js";
import { getPagination, addPagination } from "../lib/pagination.js";
import { ok } from "../lib/respond.js";
import { requireAuth, requireRoles } from "../lib/auth.js";
import { validateQuery } from "../lib/validate.js";

const router = Router();

// List audit logs
router.get(
  "/",
  requireAuth,
  requireRoles(["Super Admin", "Auditor", "LGU Admin"]),
  validateQuery({ action: { type: "string", required: false }, user_id: { type: "int", required: false }, table: { type: "string", required: false } }),
  asyncHandler(async (req, res) => {
    const { action, user_id, table } = req.validQuery || {};
    const p = getPool();
    let sql =
      "SELECT log_id, user_id, action, `timestamp`, details, ip_address, affected_table_id, affected_table FROM AuditLog";
    const params = [];
    const conditions = [];
    if (action) {
      conditions.push("action=?");
      params.push(action);
    }
    if (user_id !== undefined) {
      conditions.push("user_id=?");
      params.push(user_id);
    }
    if (table) {
      conditions.push("affected_table=?");
      params.push(table);
    }
    if (conditions.length) sql += " WHERE " + conditions.join(" AND ");
    sql += " ORDER BY log_id DESC";
    const pagination = getPagination(req.query);
    ({ sql, params } = addPagination(sql, params, pagination));
    const [rows] = await p.execute(sql, params);
    const [cnt] = await p.execute("SELECT COUNT(*) AS total FROM AuditLog", []);
    const total = cnt?.[0]?.total || 0;
    const pages = Math.ceil(total / pagination.pageSize) || 1;
    ok(res, rows, { page: pagination.page, pageSize: pagination.pageSize, total, pages });
  })
);

export default router;
