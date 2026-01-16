import { Router } from "express";
import asyncHandler from "../lib/asyncHandler.js";
import { getPool } from "../config/db.pool.js";
import { recordAudit } from "../lib/audit.js";
import { getPagination, addPagination } from "../lib/pagination.js";
import { validateBody, validateQuery } from "../lib/validate.js";
import { ok, created } from "../lib/respond.js";
import { hashPassword, requireAuth, requireRoles } from "../lib/auth.js";

const router = Router();

// List users (optionally filter by role)
router.get(
  "/",
  requireAuth,
  validateQuery({ role_id: { type: "int", required: false } }),
  asyncHandler(async (req, res) => {
    const { role_id } = req.validQuery || {};
    const p = getPool();
    let sql = `SELECT u.user_id, u.username, u.first_name, u.last_name, u.email, u.contact_number, u.role_id, u.lgu_id, r.role_name 
               FROM User u 
               JOIN Role r ON r.role_id = u.role_id`;
    let params = [];
    if (role_id !== undefined) {
      sql += " WHERE u.role_id=?";
      params.push(role_id);
    }

    // Sorting - must come BEFORE pagination (LIMIT/OFFSET)
    const sortBy = req.query.sortBy || "username";
    const sortDir = (req.query.sortDir || "ASC").toUpperCase() === "DESC" ? "DESC" : "ASC";
    const allowedSort = new Set(["username", "user_id", "role_id"]);
    const sortColumn = allowedSort.has(sortBy) ? sortBy : "username";
    sql += ` ORDER BY ${sortColumn} ${sortDir}`;
    
    // Pagination - must come AFTER ORDER BY
    const pagination = getPagination(req.query);
    const paginated = addPagination(sql, params, pagination);
    const [rows] = await p.execute(paginated.sql, paginated.params);
    
    // Total
    let countSql = "SELECT COUNT(*) AS total FROM User";
    const countParams = [];
    if (role_id !== undefined) { countSql += " WHERE role_id=?"; countParams.push(role_id); }
    const [cnt] = await p.execute(countSql, countParams);
    const total = cnt?.[0]?.total || 0;
    const pages = Math.ceil(total / pagination.pageSize) || 1;
    ok(res, rows, { page: pagination.page, pageSize: pagination.pageSize, total, pages });
  })
);

// Create user
router.post(
  "/",
  requireAuth,
  requireRoles(["Super Admin"]),
  validateBody({
    username: { type: "string", required: true, min: 3 },
    password: { type: "string", required: true, min: 6 },
    first_name: { type: "string", required: false },
    last_name: { type: "string", required: false },
    email: { type: "string", required: false },
    contact_number: { type: "string", required: false },
    role_id: { type: "int", required: true },
    lgu_id: { type: "int", required: false },
  }),
  asyncHandler(async (req, res) => {
    const { username, password, first_name, last_name, email, contact_number, role_id, lgu_id } = req.validBody;
    const p = getPool();
    const hashedPassword = await hashPassword(password);
    const [result] = await p.execute(
      "INSERT INTO User (username, password, first_name, last_name, email, contact_number, role_id, lgu_id) VALUES (?,?,?,?,?,?,?,?)",
      [username, hashedPassword, first_name, last_name, email, contact_number, role_id, lgu_id || null]
    );
    await recordAudit({ action: "USER_CREATE", affected_table: "User", affected_table_id: result.insertId, details: JSON.stringify({ username }) });
    created(res, { user_id: result.insertId });
  })
);

// Update user
router.put(
  "/:id",
  requireAuth,
  requireRoles(["Super Admin"]),
  validateBody({
    first_name: { type: "string", required: false },
    last_name: { type: "string", required: false },
    email: { type: "string", required: false },
    contact_number: { type: "string", required: false },
    role_id: { type: "int", required: true },
    lgu_id: { type: "int", required: false },
    password: { type: "string", required: false, min: 6 },
  }),
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { first_name, last_name, email, contact_number, role_id, lgu_id, password } = req.validBody;
    const p = getPool();
    
    // Build dynamic update to handle optional password
    if (password) {
      const hashedPassword = await hashPassword(password);
      await p.execute(
        "UPDATE User SET first_name=?, last_name=?, email=?, contact_number=?, role_id=?, lgu_id=?, password=? WHERE user_id=?",
        [first_name || null, last_name || null, email || null, contact_number || null, role_id, lgu_id || null, hashedPassword, id]
      );
    } else {
      await p.execute(
        "UPDATE User SET first_name=?, last_name=?, email=?, contact_number=?, role_id=?, lgu_id=? WHERE user_id=?",
        [first_name || null, last_name || null, email || null, contact_number || null, role_id, lgu_id || null, id]
      );
    }
    await recordAudit({ action: "USER_UPDATE", affected_table: "User", affected_table_id: id });
    ok(res, { ok: true });
  })
);

// Get user by id
router.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const p = getPool();
    const [rows] = await p.execute("SELECT user_id, username, first_name, last_name, email, contact_number, role_id FROM User WHERE user_id=?", [id]);
    res.json(rows[0] || null);
  })
);

// Delete user
router.delete(
  "/:id",
  requireAuth,
  requireRoles(["Super Admin"]),
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const p = getPool();
    await p.execute("DELETE FROM User WHERE user_id=?", [id]);
    await recordAudit({ action: "USER_DELETE", affected_table: "User", affected_table_id: id });
    ok(res, { ok: true });
  })
);

export default router;
