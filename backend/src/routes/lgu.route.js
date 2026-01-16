import { Router } from "express";
import asyncHandler from "../lib/asyncHandler.js";
import { getPool } from "../config/db.pool.js";
import { recordAudit } from "../lib/audit.js";
import { getPagination, addPagination } from "../lib/pagination.js";
import { validateBody } from "../lib/validate.js";
import { ok, created } from "../lib/respond.js";
import { requireAuth, requireRoles } from "../lib/auth.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const p = getPool();
    const base = "SELECT lgu_id, name, province, region, contact_email, contact_number FROM LGU ORDER BY name ASC";
    const pagination = getPagination(req.query);
    const { sql, params } = addPagination(base, [], pagination);
    const [rows] = await p.execute(sql, params);
    const [cnt] = await p.execute("SELECT COUNT(*) AS total FROM LGU", []);
    const total = cnt?.[0]?.total || 0;
    const pages = Math.ceil(total / pagination.pageSize) || 1;
    ok(res, rows, { page: pagination.page, pageSize: pagination.pageSize, total, pages });
  })
);

router.post(
  "/",
  requireAuth,
  requireRoles(["Super Admin"]),
  validateBody({ name: { type: "string", required: true, min: 2 } }),
  asyncHandler(async (req, res) => {
    const { name, province, region, contact_email, contact_number } = { ...req.body, ...req.validBody };
    const p = getPool();
    const [result] = await p.execute(
      "INSERT INTO LGU (name, province, region, contact_email, contact_number) VALUES (?,?,?,?,?)",
      [name, province || null, region || null, contact_email || null, contact_number || null]
    );
    await recordAudit({ action: "LGU_CREATE", affected_table: "LGU", affected_table_id: result.insertId });
    created(res, { lgu_id: result.insertId });
  })
);

router.put(
  "/:id",
  requireAuth,
  requireRoles(["Super Admin"]),
  validateBody({ name: { type: "string", required: false, min: 2 } }),
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { name, province, region, contact_email, contact_number } = req.body;
    const p = getPool();
    await p.execute(
      "UPDATE LGU SET name=?, province=?, region=?, contact_email=?, contact_number=? WHERE lgu_id=?",
      [name || null, province || null, region || null, contact_email || null, contact_number || null, id]
    );
    await recordAudit({ action: "LGU_UPDATE", affected_table: "LGU", affected_table_id: id });
    ok(res, { ok: true });
  })
);

router.delete(
  "/:id",
  requireAuth,
  requireRoles(["Super Admin"]),
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const p = getPool();
    await p.execute("DELETE FROM LGU WHERE lgu_id=?", [id]);
    await recordAudit({ action: "LGU_DELETE", affected_table: "LGU", affected_table_id: id });
    ok(res, { ok: true });
  })
);

export default router;
