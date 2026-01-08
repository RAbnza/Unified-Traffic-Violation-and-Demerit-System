import { Router } from "express";
import asyncHandler from "../lib/asyncHandler.js";
import { getPool } from "../config/db.pool.js";
import { recordAudit } from "../lib/audit.js";
import { getPagination, addPagination } from "../lib/pagination.js";
import { validateBody, validateQuery } from "../lib/validate.js";
import { ok, created } from "../lib/respond.js";

const router = Router();

// List users (optionally filter by role)
router.get(
  "/",
  validateQuery({ role_id: { type: "int", required: false } }),
  asyncHandler(async (req, res) => {
    const { role_id } = req.validQuery || {};
    const p = getPool();
    let sql = "SELECT user_id, username, first_name, last_name, email, contact_number, role_id FROM User";
    const params = [];
    if (role_id !== undefined) {
      sql += " WHERE role_id=?";
      params.push(role_id);
    }
    const pagination = getPagination(req.query);
    ({ sql, params } = addPagination(sql, params, pagination));

    // Sorting
    const sortBy = req.query.sortBy || "username";
    const sortDir = (req.query.sortDir || "ASC").toUpperCase() === "DESC" ? "DESC" : "ASC";
    const allowedSort = new Set(["username", "user_id", "role_id"]);
    const sortColumn = allowedSort.has(sortBy) ? sortBy : "username";
    sql += ` ORDER BY ${sortColumn} ${sortDir}`;
    ({ sql, params } = addPagination(sql, params, pagination));
    const [rows] = await p.execute(sql, params);
    
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
  validateBody({
    username: { type: "string", required: true, min: 3 },
    password: { type: "string", required: true, min: 6 },
    first_name: { type: "string", required: false },
    last_name: { type: "string", required: false },
    email: { type: "string", required: false },
    contact_number: { type: "string", required: false },
    role_id: { type: "int", required: true },
  }),
  asyncHandler(async (req, res) => {
    const { username, password, first_name, last_name, email, contact_number, role_id } = req.validBody;
    const p = getPool();
    const [result] = await p.execute(
      "INSERT INTO User (username, password, first_name, last_name, email, contact_number, role_id) VALUES (?,?,?,?,?,?,?)",
      [username, password, first_name, last_name, email, contact_number, role_id]
    );
    await recordAudit({ action: "USER_CREATE", affected_table: "User", affected_table_id: result.insertId, details: JSON.stringify({ username }) });
    created(res, { user_id: result.insertId });
  })
);

// Update user
router.put(
  "/:id",
  validateBody({
    first_name: { type: "string", required: false },
    last_name: { type: "string", required: false },
    email: { type: "string", required: false },
    contact_number: { type: "string", required: false },
    role_id: { type: "int", required: true },
  }),
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { first_name, last_name, email, contact_number, role_id } = req.validBody;
    const p = getPool();
    await p.execute(
      "UPDATE User SET first_name=?, last_name=?, email=?, contact_number=?, role_id=? WHERE user_id=?",
      [first_name || null, last_name || null, email || null, contact_number || null, role_id, id]
    );
    await recordAudit({ action: "USER_UPDATE", affected_table: "User", affected_table_id: id });
    ok(res, { ok: true });
  })
);

// Get user by id
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const p = getPool();
    const [rows] = await p.execute("SELECT user_id, username, first_name, last_name, email, contact_number, role_id FROM User WHERE user_id=?", [id]);
    res.json(rows[0] || null);
  })
);

export default router;
