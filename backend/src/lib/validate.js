function typeCheck(value, rule) {
  if (value === undefined || value === null) return !rule.required;
  switch (rule.type) {
    case "string":
      return typeof value === "string" && (!rule.min || value.length >= rule.min) && (!rule.max || value.length <= rule.max);
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "int":
      return Number.isInteger(value);
    case "enum":
      return typeof value === "string" && rule.values?.includes(value);
    case "date":
      return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
    case "time":
      return typeof value === "string" && /^\d{2}:\d{2}:\d{2}$/.test(value);
    default:
      return true;
  }
}

function coerce(value, rule) {
  if (value === undefined || value === null) return value;
  if (rule.type === "number" || rule.type === "int") {
    const n = Number(value);
    return Number.isFinite(n) ? n : value;
  }
  return value;
}

export function validateObject(schema, data) {
  const errors = [];
  const out = {};
  for (const key of Object.keys(schema)) {
    const rule = schema[key];
    const raw = data[key];
    const value = coerce(raw, rule);
    if (!typeCheck(value, rule)) {
      errors.push({ field: key, message: rule.message || `Invalid ${key}` });
    } else if (value !== undefined) {
      out[key] = value;
    }
  }
  return { ok: errors.length === 0, errors, value: out };
}

export function validateBody(schema) {
  return (req, res, next) => {
    const { ok, errors, value } = validateObject(schema, req.body || {});
    if (!ok) return res.status(400).json({ errors });
    req.validBody = value;
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const { ok, errors, value } = validateObject(schema, req.query || {});
    if (!ok) return res.status(400).json({ errors });
    req.validQuery = value;
    next();
  };
}
