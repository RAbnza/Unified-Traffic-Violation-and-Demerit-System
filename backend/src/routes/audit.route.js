import { Router } from "express";
import asyncHandler from "../lib/asyncHandler.js";
import { getPool } from "../config/db.pool.js";
import { getPagination, addPagination } from "../lib/pagination.js";
import { ok } from "../lib/respond.js";
import { requireAuth, requireRoles } from "../lib/auth.js";
import { validateQuery } from "../lib/validate.js";

const router = Router();

// List audit logs with user information
router.get(
  "/",
  requireAuth,
  requireRoles(["Super Admin", "Auditor", "LGU Admin"]),
  validateQuery({ 
    action: { type: "string", required: false }, 
    user_id: { type: "int", required: false }, 
    table: { type: "string", required: false },
    type: { type: "enum", values: ["activity", "audit", "security"], required: false }
  }),
  asyncHandler(async (req, res) => {
    const { action, user_id, table, type } = req.validQuery || {};
    const p = getPool();
    let sql =
      "SELECT a.log_id, a.user_id, a.action, a.`timestamp`, a.details, a.ip_address, a.affected_table_id, a.affected_table, " +
      "u.username, u.first_name, u.last_name, r.role_name " +
      "FROM AuditLog a " +
      "LEFT JOIN User u ON u.user_id = a.user_id " +
      "LEFT JOIN Role r ON r.role_id = u.role_id";
    const params = [];
    const conditions = [];
    
    // Filter by type category
    if (type === "activity") {
      // User activity: logins, logouts, session events
      conditions.push("(a.action LIKE '%LOGIN%' OR a.action = 'LOGOUT' OR a.action LIKE '%SESSION%')");
    } else if (type === "audit") {
      // Audit trail: CRUD operations on data tables
      conditions.push("(a.affected_table IS NOT NULL AND a.action NOT LIKE '%LOGIN%' AND a.action != 'LOGOUT')");
    } else if (type === "security") {
      // Security events: failed logins, password changes, deletions, admin actions
      conditions.push("(a.action = 'LOGIN_FAILED' OR a.action LIKE '%PASSWORD%' OR a.action LIKE '%DELETE%' OR a.action LIKE '%ROLE%')");
    }
    
    if (action) {
      conditions.push("a.action=?");
      params.push(action);
    }
    if (user_id !== undefined) {
      conditions.push("a.user_id=?");
      params.push(user_id);
    }
    if (table) {
      conditions.push("a.affected_table=?");
      params.push(table);
    }
    if (conditions.length) sql += " WHERE " + conditions.join(" AND ");
    sql += " ORDER BY a.log_id DESC";
    const pagination = getPagination(req.query);
    const paginated = addPagination(sql, params, pagination);
    const [rows] = await p.execute(paginated.sql, paginated.params);
    
    // Count with same conditions
    let countSql = "SELECT COUNT(*) AS total FROM AuditLog a";
    if (conditions.length) countSql += " WHERE " + conditions.join(" AND ");
    const [cnt] = await p.execute(countSql, params);
    const total = cnt?.[0]?.total || 0;
    const pages = Math.ceil(total / pagination.pageSize) || 1;
    ok(res, rows, { page: pagination.page, pageSize: pagination.pageSize, total, pages });
  })
);

export default router;
