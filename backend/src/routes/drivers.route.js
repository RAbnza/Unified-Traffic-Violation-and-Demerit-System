import { Router } from "express";
import asyncHandler from "../lib/asyncHandler.js";
import { getPool } from "../config/db.pool.js";
import { recordAudit } from "../lib/audit.js";
import { getPagination, addPagination } from "../lib/pagination.js";
import { validateBody, validateQuery } from "../lib/validate.js";
import { ok, created } from "../lib/respond.js";
import { requireAuth, requireRoles } from "../lib/auth.js";

const router = Router();

// List drivers with optional search
router.get(
  "/",
  requireAuth,
  validateQuery({
    search: { type: "string", required: false },
    license_number: { type: "string", required: false },
  }),
  asyncHandler(async (req, res) => {
    const { search, license_number } = req.validQuery || {};
    const p = getPool();
    let sql = "SELECT driver_id, license_number, first_name, last_name, address, birth_date, contact_number, email, license_status, demerit_points FROM Driver";
    const params = [];
    const conditions = [];
    
    if (license_number) {
      conditions.push("license_number = ?");
      params.push(license_number);
    }
    if (search) {
      conditions.push("(first_name LIKE ? OR last_name LIKE ? OR license_number LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (conditions.length) sql += " WHERE " + conditions.join(" AND ");
    sql += " ORDER BY last_name ASC, first_name ASC";
    
    const pagination = getPagination(req.query);
    const paginated = addPagination(sql, params, pagination);
    
    const [rows] = await p.execute(paginated.sql, paginated.params);
    
    // Count
    let countSql = "SELECT COUNT(*) AS total FROM Driver";
    if (conditions.length) countSql += " WHERE " + conditions.join(" AND ");
    const [cnt] = await p.execute(countSql, params);
    const total = cnt?.[0]?.total || 0;
    const pages = Math.ceil(total / pagination.pageSize) || 1;
    
    ok(res, rows, { page: pagination.page, pageSize: pagination.pageSize, total, pages });
  })
);

// Get driver by ID
router.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const p = getPool();
    const [rows] = await p.execute(
      "SELECT driver_id, license_number, first_name, last_name, address, birth_date, contact_number, email, license_status, demerit_points FROM Driver WHERE driver_id = ?",
      [req.params.id]
    );
    ok(res, rows[0] || null);
  })
);

// Get driver by license number
router.get(
  "/license/:licenseNumber",
  requireAuth,
  asyncHandler(async (req, res) => {
    const p = getPool();
    const [rows] = await p.execute(
      "SELECT driver_id, license_number, first_name, last_name, address, birth_date, contact_number, email, license_status, demerit_points FROM Driver WHERE license_number = ?",
      [req.params.licenseNumber]
    );
    ok(res, rows[0] || null);
  })
);

// Create driver
router.post(
  "/",
  requireAuth,
  requireRoles(["Super Admin", "Officer", "LGU Admin"]),
  validateBody({
    license_number: { type: "string", required: true, min: 3 },
    first_name: { type: "string", required: true },
    last_name: { type: "string", required: true },
    address: { type: "string", required: false },
    birth_date: { type: "date", required: false },
    contact_number: { type: "string", required: false },
    email: { type: "string", required: false },
  }),
  asyncHandler(async (req, res) => {
    const { license_number, first_name, last_name, address, birth_date, contact_number, email } = req.validBody;
    const p = getPool();
    
    // Check if license already exists
    const [existing] = await p.execute("SELECT driver_id FROM Driver WHERE license_number = ?", [license_number]);
    if (existing.length > 0) {
      return res.status(409).json({ 
        data: null, 
        error: { code: "CONFLICT", message: "Driver with this license number already exists" } 
      });
    }
    
    const [result] = await p.execute(
      "INSERT INTO Driver (license_number, first_name, last_name, address, birth_date, contact_number, email, license_status, demerit_points) VALUES (?,?,?,?,?,?,?, 'ACTIVE', 0)",
      [license_number, first_name, last_name, address || null, birth_date || null, contact_number || null, email || null]
    );
    
    await recordAudit({ 
      action: "DRIVER_CREATE", 
      user_id: req.user?.sub,
      affected_table: "Driver", 
      affected_table_id: result.insertId, 
      details: JSON.stringify({ license_number, first_name, last_name }) 
    });
    
    created(res, { driver_id: result.insertId });
  })
);

// Update driver
router.put(
  "/:id",
  requireAuth,
  requireRoles(["Super Admin", "LGU Admin"]),
  validateBody({
    first_name: { type: "string", required: false },
    last_name: { type: "string", required: false },
    address: { type: "string", required: false },
    contact_number: { type: "string", required: false },
    email: { type: "string", required: false },
    license_status: { type: "enum", values: ["ACTIVE", "SUSPENDED", "REVOKED"], required: false },
    demerit_points: { type: "int", required: false },
  }),
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { first_name, last_name, address, contact_number, email, license_status, demerit_points } = req.validBody;
    const p = getPool();
    
    // Build dynamic update
    const updates = [];
    const params = [];
    if (first_name !== undefined) { updates.push("first_name = ?"); params.push(first_name); }
    if (last_name !== undefined) { updates.push("last_name = ?"); params.push(last_name); }
    if (address !== undefined) { updates.push("address = ?"); params.push(address); }
    if (contact_number !== undefined) { updates.push("contact_number = ?"); params.push(contact_number); }
    if (email !== undefined) { updates.push("email = ?"); params.push(email); }
    if (license_status !== undefined) { updates.push("license_status = ?"); params.push(license_status); }
    if (demerit_points !== undefined) { updates.push("demerit_points = ?"); params.push(demerit_points); }
    
    if (updates.length === 0) {
      return ok(res, { ok: true, message: "No changes" });
    }
    
    params.push(id);
    await p.execute(`UPDATE Driver SET ${updates.join(", ")} WHERE driver_id = ?`, params);
    
    await recordAudit({ 
      action: "DRIVER_UPDATE", 
      user_id: req.user?.sub,
      affected_table: "Driver", 
      affected_table_id: id 
    });
    
    ok(res, { ok: true });
  })
);

// Get driver's tickets
router.get(
  "/:id/tickets",
  requireAuth,
  asyncHandler(async (req, res) => {
    const p = getPool();
    const [rows] = await p.execute(
      `SELECT t.*, v.plate_number, u.first_name as officer_first_name, u.last_name as officer_last_name
       FROM Ticket t
       JOIN Vehicle v ON v.vehicle_id = t.vehicle_id
       LEFT JOIN User u ON u.user_id = t.issued_by
       WHERE t.driver_id = ?
       ORDER BY t.date_issued DESC`,
      [req.params.id]
    );
    ok(res, rows);
  })
);

// Get driver's vehicles
router.get(
  "/:id/vehicles",
  requireAuth,
  asyncHandler(async (req, res) => {
    const p = getPool();
    const [rows] = await p.execute(
      "SELECT vehicle_id, plate_number, make, model, year, color, vehicle_type FROM Vehicle WHERE driver_id = ?",
      [req.params.id]
    );
    ok(res, rows);
  })
);

export default router;
