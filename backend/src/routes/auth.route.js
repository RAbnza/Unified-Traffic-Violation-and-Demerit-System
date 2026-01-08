import { Router } from "express";
import asyncHandler from "../lib/asyncHandler.js";
import { getPool } from "../config/db.pool.js";
import { verifyPassword, signToken } from "../lib/auth.js";
import { validateBody } from "../lib/validate.js";
import { ok } from "../lib/respond.js";
import { recordAudit } from "../lib/audit.js";
import { requireAuth } from "../lib/auth.js";

const router = Router();

router.post(
  "/login",
  validateBody({ username: { type: "string", required: true }, password: { type: "string", required: true } }),
  asyncHandler(async (req, res) => {
    const { username, password } = req.validBody;
    const p = getPool();
    const [rows] = await p.execute(
      "SELECT u.user_id, u.username, u.password, u.role_id, r.role_name FROM User u JOIN Role r ON r.role_id=u.role_id WHERE u.username=? LIMIT 1",
      [username]
    );
    const user = rows[0];
    if (!user) {
      await recordAudit({ action: "LOGIN_FAILED", details: JSON.stringify({ username }), ip_address: req.ip });
      return res.status(401).json({ data: null, meta: null, error: { code: "UNAUTHORIZED", message: "Invalid credentials" } });
    }
    const okPass = await verifyPassword(password, user.password);
    if (!okPass) {
      await recordAudit({ action: "LOGIN_FAILED", user_id: user.user_id, details: JSON.stringify({ username }), ip_address: req.ip });
      return res.status(401).json({ data: null, meta: null, error: { code: "UNAUTHORIZED", message: "Invalid credentials" } });
    }
    const token = signToken(user);
    await recordAudit({ action: "LOGIN_SUCCESS", user_id: user.user_id, details: JSON.stringify({ username }), ip_address: req.ip });
    ok(res, { token, user: { user_id: user.user_id, username: user.username, role_id: user.role_id, role_name: user.role_name } });
  })
);

export default router;
// Logout endpoint (stateless JWT) - audit only
router.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    await recordAudit({ action: "LOGOUT", user_id: req.user.sub, ip_address: req.ip });
    ok(res, { success: true });
  })
);
