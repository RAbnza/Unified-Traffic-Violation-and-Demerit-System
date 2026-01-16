import { Router } from "express";
import asyncHandler from "../lib/asyncHandler.js";
import { getPool } from "../config/db.pool.js";
import { recordAudit } from "../lib/audit.js";
import { getPagination, addPagination } from "../lib/pagination.js";
import { validateBody, validateQuery } from "../lib/validate.js";
import { ok, created } from "../lib/respond.js";
import { requireAuth, requireRoles } from "../lib/auth.js";

const router = Router();

// List vehicles with optional search
router.get(
  "/",
  requireAuth,
  validateQuery({
    search: { type: "string", required: false },
    plate_number: { type: "string", required: false },
    driver_id: { type: "int", required: false },
  }),
  asyncHandler(async (req, res) => {
    const { search, plate_number, driver_id } = req.validQuery || {};
    const p = getPool();
    let sql = `SELECT v.vehicle_id, v.plate_number, v.make, v.model, v.year, v.color, v.vehicle_type, v.driver_id,
               d.first_name as driver_first_name, d.last_name as driver_last_name, d.license_number
               FROM Vehicle v
               JOIN Driver d ON d.driver_id = v.driver_id`;
    const params = [];
    const conditions = [];
    
    if (plate_number) {
      conditions.push("v.plate_number = ?");
      params.push(plate_number);
    }
    if (driver_id) {
      conditions.push("v.driver_id = ?");
      params.push(driver_id);
    }
    if (search) {
      conditions.push("(v.plate_number LIKE ? OR v.make LIKE ? OR v.model LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (conditions.length) sql += " WHERE " + conditions.join(" AND ");
    sql += " ORDER BY v.plate_number ASC";
    
    const pagination = getPagination(req.query);
    const paginated = addPagination(sql, params, pagination);
    
    const [rows] = await p.execute(paginated.sql, paginated.params);
    
    // Count
    let countSql = "SELECT COUNT(*) AS total FROM Vehicle v";
    if (conditions.length) countSql += " WHERE " + conditions.join(" AND ");
    const [cnt] = await p.execute(countSql, params);
    const total = cnt?.[0]?.total || 0;
    const pages = Math.ceil(total / pagination.pageSize) || 1;
    
    ok(res, rows, { page: pagination.page, pageSize: pagination.pageSize, total, pages });
  })
);

// Get vehicle by ID
router.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const p = getPool();
    const [rows] = await p.execute(
      `SELECT v.vehicle_id, v.plate_number, v.make, v.model, v.year, v.color, v.vehicle_type, v.driver_id,
       d.first_name as driver_first_name, d.last_name as driver_last_name, d.license_number
       FROM Vehicle v
       JOIN Driver d ON d.driver_id = v.driver_id
       WHERE v.vehicle_id = ?`,
      [req.params.id]
    );
    ok(res, rows[0] || null);
  })
);

// Get vehicle by plate number
router.get(
  "/plate/:plateNumber",
  requireAuth,
  asyncHandler(async (req, res) => {
    const p = getPool();
    const [rows] = await p.execute(
      `SELECT v.vehicle_id, v.plate_number, v.make, v.model, v.year, v.color, v.vehicle_type, v.driver_id,
       d.first_name as driver_first_name, d.last_name as driver_last_name, d.license_number
       FROM Vehicle v
       JOIN Driver d ON d.driver_id = v.driver_id
       WHERE v.plate_number = ?`,
      [req.params.plateNumber]
    );
    ok(res, rows[0] || null);
  })
);

// Create vehicle
router.post(
  "/",
  requireAuth,
  requireRoles(["Super Admin", "Officer", "LGU Admin"]),
  validateBody({
    plate_number: { type: "string", required: true, min: 3 },
    make: { type: "string", required: false },
    model: { type: "string", required: false },
    year: { type: "int", required: false },
    color: { type: "string", required: false },
    vehicle_type: { type: "string", required: false },
    driver_id: { type: "int", required: true },
  }),
  asyncHandler(async (req, res) => {
    const { plate_number, make, model, year, color, vehicle_type, driver_id } = req.validBody;
    const p = getPool();
    
    // Check if plate already exists
    const [existing] = await p.execute("SELECT vehicle_id FROM Vehicle WHERE plate_number = ?", [plate_number]);
    if (existing.length > 0) {
      return res.status(409).json({ 
        data: null, 
        error: { code: "CONFLICT", message: "Vehicle with this plate number already exists" } 
      });
    }
    
    // Check driver exists
    const [driver] = await p.execute("SELECT driver_id FROM Driver WHERE driver_id = ?", [driver_id]);
    if (driver.length === 0) {
      return res.status(404).json({ 
        data: null, 
        error: { code: "NOT_FOUND", message: "Driver not found" } 
      });
    }
    
    const [result] = await p.execute(
      "INSERT INTO Vehicle (plate_number, make, model, year, color, vehicle_type, driver_id) VALUES (?,?,?,?,?,?,?)",
      [plate_number, make || null, model || null, year || null, color || null, vehicle_type || null, driver_id]
    );
    
    await recordAudit({ 
      action: "VEHICLE_CREATE", 
      user_id: req.user?.sub,
      affected_table: "Vehicle", 
      affected_table_id: result.insertId, 
      details: JSON.stringify({ plate_number, driver_id }) 
    });
    
    created(res, { vehicle_id: result.insertId });
  })
);

// Update vehicle
router.put(
  "/:id",
  requireAuth,
  requireRoles(["Super Admin", "LGU Admin"]),
  validateBody({
    make: { type: "string", required: false },
    model: { type: "string", required: false },
    year: { type: "int", required: false },
    color: { type: "string", required: false },
    vehicle_type: { type: "string", required: false },
  }),
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { make, model, year, color, vehicle_type } = req.validBody;
    const p = getPool();
    
    const updates = [];
    const params = [];
    if (make !== undefined) { updates.push("make = ?"); params.push(make); }
    if (model !== undefined) { updates.push("model = ?"); params.push(model); }
    if (year !== undefined) { updates.push("year = ?"); params.push(year); }
    if (color !== undefined) { updates.push("color = ?"); params.push(color); }
    if (vehicle_type !== undefined) { updates.push("vehicle_type = ?"); params.push(vehicle_type); }
    
    if (updates.length === 0) {
      return ok(res, { ok: true, message: "No changes" });
    }
    
    params.push(id);
    await p.execute(`UPDATE Vehicle SET ${updates.join(", ")} WHERE vehicle_id = ?`, params);
    
    await recordAudit({ 
      action: "VEHICLE_UPDATE", 
      user_id: req.user?.sub,
      affected_table: "Vehicle", 
      affected_table_id: id 
    });
    
    ok(res, { ok: true });
  })
);

// Get vehicle's tickets
router.get(
  "/:id/tickets",
  requireAuth,
  asyncHandler(async (req, res) => {
    const p = getPool();
    const [rows] = await p.execute(
      `SELECT t.*, d.first_name, d.last_name, d.license_number, u.first_name as officer_first_name, u.last_name as officer_last_name
       FROM Ticket t
       JOIN Driver d ON d.driver_id = t.driver_id
       LEFT JOIN User u ON u.user_id = t.issued_by
       WHERE t.vehicle_id = ?
       ORDER BY t.date_issued DESC`,
      [req.params.id]
    );
    ok(res, rows);
  })
);

export default router;
