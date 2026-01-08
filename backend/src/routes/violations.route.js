import { Router } from "express";
import asyncHandler from "../lib/asyncHandler.js";
import { getPool } from "../config/db.pool.js";
import { getPagination, addPagination } from "../lib/pagination.js";
import { ok } from "../lib/respond.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const p = getPool();
    const base = "SELECT violation_type_id, name, description, fine_amount, demerit_point FROM ViolationType ORDER BY name ASC";
    const pagination = getPagination(req.query);
    const { sql, params } = addPagination(base, [], pagination);
    const [rows] = await p.execute(sql, params);
    const [cnt] = await p.execute("SELECT COUNT(*) AS total FROM ViolationType", []);
    const total = cnt?.[0]?.total || 0;
    const pages = Math.ceil(total / pagination.pageSize) || 1;
    ok(res, rows, { page: pagination.page, pageSize: pagination.pageSize, total, pages });
  })
);

export default router;
