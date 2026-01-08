import express from "express";
import asyncHandler from "../lib/asyncHandler.js";
import { getPool } from "../config/db.pool.js";
import { requireAuth, requireRoles } from "../lib/auth.js";
import { validateBody, validateQuery } from "../lib/validate.js";
import { ok, created } from "../lib/respond.js";

const router = express.Router();

// Create a backup entry
router.post(
  "/",
  requireAuth,
  requireRoles(["Super Admin"]),
  validateBody({
    status: { type: "enum", values: ["SUCCESS", "FAILED", "IN_PROGRESS"], optional: true },
    notes: { type: "string", optional: true },
  }),
  asyncHandler(async (req, res) => {
    const p = getPool();
    const { status = "IN_PROGRESS", notes = null } = req.body;
    const userId = req.user?.user_id;
    const [result] = await p.execute(
      "INSERT INTO BackupHistory (action, status, triggered_by, notes) VALUES (?,?,?,?)",
      ["BACKUP", status, userId || null, notes]
    );
    created(res, { backup_id: result.insertId });
  })
);

// Create a restore entry
router.post(
  "/restore",
  requireAuth,
  requireRoles(["Super Admin"]),
  validateBody({
    status: { type: "enum", values: ["SUCCESS", "FAILED", "IN_PROGRESS"], optional: true },
    notes: { type: "string", optional: true },
  }),
  asyncHandler(async (req, res) => {
    const p = getPool();
    const { status = "IN_PROGRESS", notes = null } = req.body;
    const userId = req.user?.user_id;
    const [result] = await p.execute(
      "INSERT INTO BackupHistory (action, status, triggered_by, notes) VALUES (?,?,?,?)",
      ["RESTORE", status, userId || null, notes]
    );
    created(res, { backup_id: result.insertId });
  })
);

// List backup/restore history with filters
router.get(
  "/history",
  requireAuth,
  requireRoles(["Admin"]),
  validateQuery({
    action: { type: "enum", values: ["BACKUP", "RESTORE"], optional: true },
    status: { type: "enum", values: ["SUCCESS", "FAILED", "IN_PROGRESS"], optional: true },
    user_id: { type: "int", optional: true },
    start_date: { type: "date", optional: true },
    end_date: { type: "date", optional: true },
    page: { type: "int", optional: true },
    pageSize: { type: "int", optional: true },
  }),
  asyncHandler(async (req, res) => {
    const p = getPool();
    const {
      action,
      status,
      user_id,
      start_date,
      end_date,
      page = 1,
      pageSize = 10,
    } = req.query;

    const where = [];
    const params = [];
    if (action) {
      where.push("action = ?");
      params.push(action);
    }
    if (status) {
      where.push("status = ?");
      params.push(status);
    }
    if (user_id) {
      where.push("triggered_by = ?");
      params.push(Number(user_id));
    }
    if (start_date) {
      where.push("started_at >= ?");
      params.push(start_date);
    }
    if (end_date) {
      where.push("started_at <= ?");
      params.push(end_date);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // Count total with same filters
    const [countRows] = await p.execute(
      `SELECT COUNT(*) AS total FROM BackupHistory ${whereSql}`,
      params
    );
    const total = countRows?.[0]?.total || 0;
    const pages = Math.ceil(total / Number(pageSize)) || 1;

    // Page query
    const offset = (Number(page) - 1) * Number(pageSize);
    const [rows] = await p.execute(
      `SELECT b.backup_id, b.action, b.status, b.started_at, b.completed_at, b.notes, b.triggered_by, u.username
       FROM BackupHistory b
       LEFT JOIN User u ON u.user_id = b.triggered_by
       ${whereSql}
       ORDER BY b.started_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), Number(offset)]
    );

    ok(res, rows, { page: Number(page), pageSize: Number(pageSize), total, pages });
  })
);

export default router;