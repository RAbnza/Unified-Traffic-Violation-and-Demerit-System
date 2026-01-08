import { Router } from "express";
import { testConnection, pingDetails } from "../config/db.pool.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "Backend is running!" });
});

// Simple DB connectivity test: GET /api/test/db
router.get("/db", async (req, res) => {
  try {
    const ok = await testConnection();
    res.json({ database: ok ? "connected" : "not_connected" });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message,
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
    });
  }
});

// Detailed DB diagnostics (do not expose publicly in production)
router.get("/db/details", async (req, res) => {
  try {
    const info = await pingDetails();
    res.json(info);
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message,
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
    });
  }
});

export default router;
