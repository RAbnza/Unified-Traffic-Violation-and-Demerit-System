import { Router } from "express";
import asyncHandler from "../lib/asyncHandler.js";
import { getPool } from "../config/db.pool.js";
import { recordAudit } from "../lib/audit.js";
import { getPagination, addPagination } from "../lib/pagination.js";
import { validateBody, validateQuery } from "../lib/validate.js";
import { ok } from "../lib/respond.js";
import { requireAuth, requireRoles } from "../lib/auth.js";

const router = Router();

// List tickets (optional filters: status, driver_id, lgu_id)
router.get(
  "/",
  requireAuth,
  validateQuery({
    status: { type: "enum", values: ["OPEN", "PAID", "DISMISSED"], required: false },
    driver_id: { type: "int", required: false },
    lgu_id: { type: "int", required: false },
  }),
  asyncHandler(async (req, res) => {
    const { status, driver_id, lgu_id } = req.validQuery || {};
    const p = getPool();
    let sql =
      "SELECT t.*, d.first_name, d.last_name, d.demerit_points AS driver_demerit_points, v.plate_number, " +
      "u.username AS issued_by_username, u.first_name AS officer_first_name, u.last_name AS officer_last_name, " +
      "GROUP_CONCAT(DISTINCT vt.name SEPARATOR ', ') AS violation_names, " +
      "SUM(vt.fine_amount) AS total_fine, " +
      "SUM(vt.demerit_point) AS total_demerit_points, " +
      "p.payment_method, p.receipt_number, p.payment_date AS paid_date, " +
      "pu.first_name AS processed_by_first_name, pu.last_name AS processed_by_last_name, pu.username AS processed_by_username " +
      "FROM Ticket t " +
      "JOIN Driver d ON d.driver_id=t.driver_id " +
      "JOIN Vehicle v ON v.vehicle_id=t.vehicle_id " +
      "LEFT JOIN User u ON u.user_id=t.issued_by " +
      "LEFT JOIN TicketViolation tv ON tv.ticket_id=t.ticket_id " +
      "LEFT JOIN ViolationType vt ON vt.violation_type_id=tv.violation_type_id " +
      "LEFT JOIN Payment p ON p.ticket_id=t.ticket_id " +
      "LEFT JOIN User pu ON pu.user_id=p.processed_by";
    let params = [];
    const conditions = [];
    
    // Officers can only see their own tickets
    if (req.user.role_name === "Officer") {
      conditions.push("t.issued_by=?");
      params.push(req.user.sub);
    }
    
    if (status) {
      conditions.push("t.status=?");
      params.push(status);
    }
    if (driver_id !== undefined) {
      conditions.push("t.driver_id=?");
      params.push(driver_id);
    }
    if (lgu_id !== undefined) {
      conditions.push("t.lgu_id=?");
      params.push(lgu_id);
    }
    if (conditions.length) sql += " WHERE " + conditions.join(" AND ");
    
    // Group by ticket to aggregate violations
    sql += " GROUP BY t.ticket_id, d.first_name, d.last_name, v.plate_number, u.username, u.first_name, u.last_name, p.payment_method, p.receipt_number, p.payment_date, pu.first_name, pu.last_name, pu.username";
    
    // Sorting
    const sortBy = req.query.sortBy || "t.ticket_id";
    const sortDir = (req.query.sortDir || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";
    const allowedSort = new Set(["t.ticket_id", "t.ticket_number", "t.date_issued", "t.status"]);
    const sortColumn = allowedSort.has(sortBy) ? sortBy : "t.ticket_id";
    sql += ` ORDER BY ${sortColumn} ${sortDir}`;

    // Pagination (only once)
    const pagination = getPagination(req.query);
    const paginated = addPagination(sql, params, pagination);
    const [rows] = await p.execute(paginated.sql, paginated.params);
    
    // Total meta
    let countSql = "SELECT COUNT(*) AS total FROM Ticket t";
    const countCond = [];
    const countParams = [];
    
    // Officers can only see their own tickets
    if (req.user.role_name === "Officer") {
      countCond.push("t.issued_by=?");
      countParams.push(req.user.sub);
    }
    
    if (status) { countCond.push("t.status=?"); countParams.push(status); }
    if (driver_id !== undefined) { countCond.push("t.driver_id=?"); countParams.push(driver_id); }
    if (lgu_id !== undefined) { countCond.push("t.lgu_id=?"); countParams.push(lgu_id); }
    if (countCond.length) countSql += " WHERE " + countCond.join(" AND ");
    const [cnt] = await p.execute(countSql, countParams);
    const total = cnt?.[0]?.total || 0;
    const pages = Math.ceil(total / pagination.pageSize) || 1;
    ok(res, rows, { page: pagination.page, pageSize: pagination.pageSize, total, pages });
  })
);

// Get ticket by id
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const p = getPool();
    const [rows] = await p.execute(
      "SELECT * FROM Ticket WHERE ticket_id=?",
      [req.params.id]
    );
    res.json(rows[0] || null);
  })
);

// Create ticket
router.post(
  "/",
  requireAuth,
  requireRoles(["Officer", "LGU Admin"]),
  validateBody({
    ticket_number: { type: "string", required: true, min: 3 },
    date_issued: { type: "date", required: true },
    time_issued: { type: "time", required: true },
    location: { type: "string", required: false },
    driver_id: { type: "int", required: true },
    vehicle_id: { type: "int", required: true },
    issued_by: { type: "int", required: true },
    lgu_id: { type: "int", required: true },
  }),
  asyncHandler(async (req, res) => {
    const { ticket_number, date_issued, time_issued, location, driver_id, vehicle_id, issued_by, lgu_id } = req.validBody;
    const p = getPool();
    const [result] = await p.execute(
      "INSERT INTO Ticket (ticket_number, date_issued, time_issued, location, status, driver_id, vehicle_id, issued_by, lgu_id) VALUES (?,?,?,?, 'OPEN', ?,?,?,?)",
      [ticket_number, date_issued, time_issued, location || null, driver_id, vehicle_id, issued_by, lgu_id]
    );
    await recordAudit({ action: "TICKET_CREATE", affected_table: "Ticket", affected_table_id: result.insertId, details: JSON.stringify({ ticket_number }) });
    res.status(201).json({ ticket_id: result.insertId });
  })
);

// Update ticket (edit details)
router.put(
  "/:id",
  requireAuth,
  requireRoles(["Officer", "LGU Admin", "LGU Staff"]),
  validateBody({
    location: { type: "string", required: false },
    status: { type: "enum", values: ["OPEN", "PAID", "DISMISSED"], required: false },
  }),
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { location, status } = req.validBody;
    const p = getPool();
    
    // Build dynamic UPDATE query
    const updates = [];
    const params = [];
    if (location !== undefined) { updates.push("location=?"); params.push(location); }
    if (status !== undefined) { updates.push("status=?"); params.push(status); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: { code: "BAD_REQUEST", message: "No fields to update" } });
    }
    
    params.push(id);
    await p.execute(`UPDATE Ticket SET ${updates.join(", ")} WHERE ticket_id=?`, params);
    await recordAudit({ action: "TICKET_UPDATE", affected_table: "Ticket", affected_table_id: id });
    res.json({ ok: true });
  })
);

// Add violation to ticket
router.post(
  "/:id/violations",
  requireAuth,
  requireRoles(["Officer", "LGU Admin"]),
  validateBody({ violation_type_id: { type: "int", required: true } }),
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { violation_type_id } = req.validBody;
    const p = getPool();
    
    // Insert the violation
    const [r] = await p.execute(
      "INSERT INTO TicketViolation (ticket_id, violation_type_id) VALUES (?,?)",
      [id, violation_type_id]
    );
    
    // Get the demerit points for this violation and add to driver
    const [violation] = await p.execute(
      "SELECT demerit_point FROM ViolationType WHERE violation_type_id = ?",
      [violation_type_id]
    );
    
    let licenseStatusChanged = false;
    let newLicenseStatus = null;
    
    if (violation[0]?.demerit_point > 0) {
      // Get the driver_id from the ticket and add demerit points
      const [ticket] = await p.execute("SELECT driver_id FROM Ticket WHERE ticket_id = ?", [id]);
      if (ticket[0]?.driver_id) {
        // Add demerit points to driver
        await p.execute(
          "UPDATE Driver SET demerit_points = demerit_points + ? WHERE driver_id = ?",
          [violation[0].demerit_point, ticket[0].driver_id]
        );
        
        await recordAudit({ 
          action: "DRIVER_DEMERIT_ADD", 
          user_id: req.user?.sub,
          affected_table: "Driver", 
          affected_table_id: ticket[0].driver_id, 
          details: JSON.stringify({ points_added: violation[0].demerit_point, ticket_id: id, violation_type_id }) 
        });
        
        // Get updated driver demerit points and check against threshold
        const [driver] = await p.execute(
          "SELECT demerit_points, license_status FROM Driver WHERE driver_id = ?",
          [ticket[0].driver_id]
        );
        
        // Get system threshold
        const [thresholdConfig] = await p.execute(
          "SELECT `value` FROM SystemConfig WHERE `key` = 'demerit_threshold'"
        );
        const threshold = thresholdConfig[0]?.value ? parseInt(thresholdConfig[0].value) : 12;
        
        // If driver's demerit points >= threshold and license is still ACTIVE, suspend it
        if (driver[0]?.demerit_points >= threshold && driver[0]?.license_status === 'ACTIVE') {
          await p.execute(
            "UPDATE Driver SET license_status = 'SUSPENDED' WHERE driver_id = ?",
            [ticket[0].driver_id]
          );
          
          licenseStatusChanged = true;
          newLicenseStatus = 'SUSPENDED';
          
          await recordAudit({ 
            action: "DRIVER_LICENSE_SUSPENDED", 
            user_id: req.user?.sub,
            affected_table: "Driver", 
            affected_table_id: ticket[0].driver_id, 
            details: JSON.stringify({ 
              reason: "Demerit points exceeded threshold", 
              demerit_points: driver[0].demerit_points, 
              threshold 
            }) 
          });
        }
      }
    }
    
    await recordAudit({ action: "TICKET_ADD_VIOLATION", user_id: req.user?.sub, affected_table: "TicketViolation", affected_table_id: r.insertId, details: JSON.stringify({ ticket_id: id, violation_type_id }) });
    res.status(201).json({ 
      ticket_violation_id: r.insertId, 
      demerit_points_added: violation[0]?.demerit_point || 0,
      license_status_changed: licenseStatusChanged,
      new_license_status: newLicenseStatus
    });
  })
);

export default router;
