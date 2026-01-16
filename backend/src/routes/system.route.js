import { Router } from "express";
import asyncHandler from "../lib/asyncHandler.js";
import { getPool } from "../config/db.pool.js";
import { ok, created } from "../lib/respond.js";

const router = Router();

// Get system parameter by key
router.get(
  "/config/:key",
  asyncHandler(async (req, res) => {
    const p = getPool();
        const [rows] = await p.execute("SELECT `key`, `value`, description FROM SystemConfig WHERE `key`=?", [req.params.key]);
        ok(res, rows[0] || null);
  })
);

// Update system parameter
router.put(
  "/config/:key",
  asyncHandler(async (req, res) => {
    const p = getPool();
    const { value, description } = req.body;
    await p.execute(
      "INSERT INTO SystemConfig (`key`, `value`, description) VALUES (?,?,?) ON DUPLICATE KEY UPDATE `value`=VALUES(`value`), description=VALUES(description)",
      [req.params.key, String(value), description || null]
    );
    created(res, { ok: true });
  })
);

// DB status: version and approximate size
router.get(
  "/db/status",
  asyncHandler(async (req, res) => {
    const p = getPool();
    const [ver] = await p.query("SELECT @@version AS version, DATABASE() AS db");
    const db = ver?.[0]?.db;
    const [sizeRows] = await p.query(
      "SELECT SUM(data_length + index_length) AS bytes FROM information_schema.tables WHERE table_schema=?",
      [db]
    );
    ok(res, { version: ver?.[0]?.version, database: db, size_bytes: sizeRows?.[0]?.bytes || 0 });
  })
);

export default router;
