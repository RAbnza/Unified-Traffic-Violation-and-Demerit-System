import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const { JWT_SECRET = "change_me_dev_secret", JWT_EXPIRES = "1d" } = process.env;

export async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signToken(user) {
  const payload = {
    sub: user.user_id,
    username: user.username,
    role_id: user.role_id,
    role_name: user.role_name,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ data: null, meta: null, error: { code: "UNAUTHORIZED", message: "Missing token" } });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ data: null, meta: null, error: { code: "UNAUTHORIZED", message: "Invalid token" } });
  }
}

export function requireRoles(allowed) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ data: null, meta: null, error: { code: "UNAUTHORIZED", message: "No user" } });
    const role = req.user.role_name || "";
    if (!allowed.includes(role)) return res.status(403).json({ data: null, meta: null, error: { code: "FORBIDDEN", message: "Insufficient role" } });
    next();
  };
}
