import { Router } from "express";
import asyncHandler from "../lib/asyncHandler.js";
import { getPool } from "../config/db.pool.js";
import { recordAudit } from "../lib/audit.js";
import { getPagination, addPagination } from "../lib/pagination.js";
import { validateBody, validateQuery } from "../lib/validate.js";
import { ok, created } from "../lib/respond.js";
import { requireAuth, requireRoles } from "../lib/auth.js";

const router = Router();

// Create payment for a ticket
router.post(
  "/",
  requireAuth,
  requireRoles(["Super Admin", "LGU Staff"]),
  validateBody({
    ticket_id: { type: "int", required: true },
    amount_paid: { type: "number", required: true },
    payment_date: { type: "date", required: false },
    payment_method: { type: "string", required: false },
    receipt_number: { type: "string", required: true, min: 3 },
    processed_by: { type: "int", required: true },
  }),
  asyncHandler(async (req, res) => {
    const { ticket_id, amount_paid, payment_date, payment_method, receipt_number, processed_by } = req.validBody;
    const p = getPool();
    const [result] = await p.execute(
      "INSERT INTO Payment (ticket_id, amount_paid, payment_date, payment_method, receipt_number, processed_by) VALUES (?,?,?,?,?,?)",
      [ticket_id, amount_paid, payment_date || new Date(), payment_method || null, receipt_number, processed_by]
    );
    await p.execute("UPDATE Ticket SET status='PAID' WHERE ticket_id=?", [ticket_id]);
    await recordAudit({ action: "PAYMENT_CREATE", affected_table: "Payment", affected_table_id: result.insertId, details: JSON.stringify({ ticket_id, receipt_number }) });
    created(res, { payment_id: result.insertId });
  })
);

// List payments (optionally by ticket)
router.get(
  "/",
  validateQuery({ ticket_id: { type: "int", required: false } }),
  asyncHandler(async (req, res) => {
    const { ticket_id } = req.validQuery || {};
    const p = getPool();
    let sql = "SELECT * FROM Payment";
    let params = [];
    if (ticket_id !== undefined) {
      sql += " WHERE ticket_id=?";
      params.push(ticket_id);
    }
    
    // Sorting
    const sortBy = req.query.sortBy || "payment_id";
    const sortDir = (req.query.sortDir || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";
    const allowedSort = new Set(["payment_id", "payment_date", "amount_paid"]);
    const sortColumn = allowedSort.has(sortBy) ? sortBy : "payment_id";
    sql += ` ORDER BY ${sortColumn} ${sortDir}`;
    
    // Pagination (only once)
    const pagination = getPagination(req.query);
    const paginated = addPagination(sql, params, pagination);
    const [rows] = await p.execute(paginated.sql, paginated.params);
    // Total
    let countSql = "SELECT COUNT(*) AS total FROM Payment";
    const countParams = [];
    if (ticket_id !== undefined) { countSql += " WHERE ticket_id=?"; countParams.push(ticket_id); }
    const [cnt] = await p.execute(countSql, countParams);
    const total = cnt?.[0]?.total || 0;
    const pages = Math.ceil(total / pagination.pageSize) || 1;
    ok(res, rows, { page: pagination.page, pageSize: pagination.pageSize, total, pages });
  })
);

export default router;
