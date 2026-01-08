import { Router } from "express";
import asyncHandler from "../lib/asyncHandler.js";
import { getPool } from "../config/db.pool.js";
import { validateQuery } from "../lib/validate.js";
import { ok } from "../lib/respond.js";

const router = Router();

// Payments aggregated by day
router.get(
  "/payments",
  validateQuery({ from: { type: "date", required: false }, to: { type: "date", required: false }, lgu_id: { type: "int", required: false } }),
  asyncHandler(async (req, res) => {
    const { from, to, lgu_id } = req.validQuery || {};
    const p = getPool();
    let sql = "SELECT DATE(payment_date) AS day, SUM(amount_paid) AS total_amount, COUNT(*) AS count FROM Payment p JOIN Ticket t ON t.ticket_id=p.ticket_id";
    const cond = [];
    const params = [];
    if (from) { cond.push("DATE(p.payment_date) >= ?"); params.push(from); }
    if (to) { cond.push("DATE(p.payment_date) <= ?"); params.push(to); }
    if (lgu_id !== undefined) { cond.push("t.lgu_id = ?"); params.push(lgu_id); }
    if (cond.length) sql += " WHERE " + cond.join(" AND ");
    sql += " GROUP BY DATE(payment_date) ORDER BY day ASC";
    const [rows] = await p.execute(sql, params);
    ok(res, rows);
  })
);

// Violations count by type
router.get(
  "/violations",
  validateQuery({ from: { type: "date", required: false }, to: { type: "date", required: false }, lgu_id: { type: "int", required: false } }),
  asyncHandler(async (req, res) => {
    const { from, to, lgu_id } = req.validQuery || {};
    const p = getPool();
    let sql = "SELECT vt.name, COUNT(*) AS count FROM TicketViolation tv JOIN Ticket t ON t.ticket_id=tv.ticket_id JOIN ViolationType vt ON vt.violation_type_id=tv.violation_type_id";
    const cond = [];
    const params = [];
    if (from) { cond.push("DATE(t.date_issued) >= ?"); params.push(from); }
    if (to) { cond.push("DATE(t.date_issued) <= ?"); params.push(to); }
    if (lgu_id !== undefined) { cond.push("t.lgu_id = ?"); params.push(lgu_id); }
    if (cond.length) sql += " WHERE " + cond.join(" AND ");
    sql += " GROUP BY vt.name ORDER BY count DESC";
    const [rows] = await p.execute(sql, params);
    ok(res, rows);
  })
);

// Ticket status counts
router.get(
  "/ticket-status",
  validateQuery({ from: { type: "date", required: false }, to: { type: "date", required: false }, lgu_id: { type: "int", required: false } }),
  asyncHandler(async (req, res) => {
    const { from, to, lgu_id } = req.validQuery || {};
    const p = getPool();
    let sql = "SELECT status, COUNT(*) AS count FROM Ticket";
    const cond = [];
    const params = [];
    if (from) { cond.push("DATE(date_issued) >= ?"); params.push(from); }
    if (to) { cond.push("DATE(date_issued) <= ?"); params.push(to); }
    if (lgu_id !== undefined) { cond.push("lgu_id = ?"); params.push(lgu_id); }
    if (cond.length) sql += " WHERE " + cond.join(" AND ");
    sql += " GROUP BY status ORDER BY status";
    const [rows] = await p.execute(sql, params);
    ok(res, rows);
  })
);

export default router;
