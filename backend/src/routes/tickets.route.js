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
  validateQuery({
    status: { type: "enum", values: ["OPEN", "PAID", "DISMISSED"], required: false },
    driver_id: { type: "int", required: false },
    lgu_id: { type: "int", required: false },
  }),
  asyncHandler(async (req, res) => {
    const { status, driver_id, lgu_id } = req.validQuery || {};
    const p = getPool();
    let sql =
      "SELECT t.*, d.first_name, d.last_name, v.plate_number FROM Ticket t " +
      "JOIN Driver d ON d.driver_id=t.driver_id " +
      "JOIN Vehicle v ON v.vehicle_id=t.vehicle_id";
    const params = [];
    const conditions = [];
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
    sql += " ORDER BY t.ticket_id DESC";
    const pagination = getPagination(req.query);
    ({ sql, params } = addPagination(sql, params, pagination));
    // Sorting
    const sortBy = req.query.sortBy || "t.ticket_id";
    const sortDir = (req.query.sortDir || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";
    const allowedSort = new Set(["t.ticket_id", "t.ticket_number", "t.date_issued", "t.status"]);
    const sortColumn = allowedSort.has(sortBy) ? sortBy : "t.ticket_id";
    sql = sql.replace(" ORDER BY t.ticket_id DESC", "") + ` ORDER BY ${sortColumn} ${sortDir}`;

    // Pagination
    ({ sql, params } = addPagination(sql, params, pagination));
    const [rows] = await p.execute(sql, params);
    
    // Total meta
    let countSql = "SELECT COUNT(*) AS total FROM Ticket t";
    const countCond = [];
    const countParams = [];
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
  requireRoles(["Officer", "LGU Admin"]),
  validateBody({
    location: { type: "string", required: false },
    status: { type: "enum", values: ["OPEN", "PAID", "DISMISSED"], required: true },
  }),
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { location, status } = req.validBody;
    const p = getPool();
    await p.execute("UPDATE Ticket SET location=?, status=? WHERE ticket_id=?", [location || null, status, id]);
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
    const [r] = await p.execute(
      "INSERT INTO TicketViolation (ticket_id, violation_type_id) VALUES (?,?)",
      [id, violation_type_id]
    );
    await recordAudit({ action: "TICKET_ADD_VIOLATION", affected_table: "TicketViolation", affected_table_id: r.insertId, details: JSON.stringify({ ticket_id: id, violation_type_id }) });
    res.status(201).json({ ticket_violation_id: r.insertId });
  })
);

export default router;
