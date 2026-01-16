import { Router } from "express";
import asyncHandler from "../lib/asyncHandler.js";
import { getPool } from "../config/db.pool.js";
import { recordAudit } from "../lib/audit.js";
import { requireAuth, requireRoles } from "../lib/auth.js";
import { getPagination, addPagination } from "../lib/pagination.js";
import { validateBody, validateQuery } from "../lib/validate.js";
import { ok, created } from "../lib/respond.js";

const router = Router();

// List assignments (filter by user_id, lgu_id, status)
router.get(
  "/",
  requireAuth,
  validateQuery({ user_id: { type: "int", required: false }, lgu_id: { type: "int", required: false }, status: { type: "enum", values: ["ACTIVE", "ENDED"], required: false } }),
  asyncHandler(async (req, res) => {
    const { user_id, lgu_id, status } = req.validQuery || {};
    const p = getPool();
    let sql = "SELECT * FROM OfficerAssignment";
    let params = [];
    const cond = [];
    if (user_id !== undefined) { cond.push("user_id=?"); params.push(user_id); }
    if (lgu_id !== undefined) { cond.push("lgu_id=?"); params.push(lgu_id); }
    if (status) { cond.push("status=?"); params.push(status); }
    if (cond.length) sql += " WHERE " + cond.join(" AND ");
    sql += " ORDER BY assignment_id DESC";
    const pagination = getPagination(req.query);
    const paginated = addPagination(sql, params, pagination);
    const [rows] = await p.execute(paginated.sql, paginated.params);
    ok(res, rows, { page: pagination.page, pageSize: pagination.pageSize });
  })
);

// Create assignment (Super Admin or LGU Admin)
router.post(
  "/",
  requireAuth,
  requireRoles(["Super Admin", "LGU Admin"]),
  validateBody({ user_id: { type: "int", required: true }, lgu_id: { type: "int", required: true }, date_assigned: { type: "date", required: false } }),
  asyncHandler(async (req, res) => {
    const { user_id, lgu_id, date_assigned } = req.validBody;
    const p = getPool();
    const [result] = await p.execute(
      "INSERT INTO OfficerAssignment (user_id, lgu_id, date_assigned, status) VALUES (?,?,?, 'ACTIVE')",
      [user_id, lgu_id, date_assigned || new Date().toISOString().slice(0,10)]
    );
    await recordAudit({ user_id: req.user.sub, action: "ASSIGNMENT_CREATE", affected_table: "OfficerAssignment", affected_table_id: result.insertId });
    created(res, { assignment_id: result.insertId });
  })
);

// Close assignment
router.put(
  "/:id/end",
  requireAuth,
  requireRoles(["Super Admin", "LGU Admin"]),
  validateBody({ date_ended: { type: "date", required: false } }),
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { date_ended } = req.validBody;
    const p = getPool();
    await p.execute("UPDATE OfficerAssignment SET status='ENDED', date_ended=? WHERE assignment_id=?", [date_ended || new Date().toISOString().slice(0,10), id]);
    await recordAudit({ user_id: req.user.sub, action: "ASSIGNMENT_END", affected_table: "OfficerAssignment", affected_table_id: id });
    ok(res, { ok: true });
  })
);

export default router;
