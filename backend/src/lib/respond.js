export function ok(res, data, meta) {
  res.json({ data, meta: meta || null, error: null });
}

export function created(res, data, meta) {
  res.status(201).json({ data, meta: meta || null, error: null });
}

export function badRequest(res, errors) {
  res.status(400).json({ data: null, meta: null, error: { code: "BAD_REQUEST", message: "Validation failed", details: errors } });
}

export function serverError(res, message) {
  res.status(500).json({ data: null, meta: null, error: { code: "SERVER_ERROR", message } });
}
