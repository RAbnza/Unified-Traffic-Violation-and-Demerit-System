export function getPagination(query) {
  let page = Number(query.page || 1);
  let pageSize = Number(query.pageSize || query.limit || 20);
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = 20;
  if (pageSize > 100) pageSize = 100; // safety cap
  const offset = (page - 1) * pageSize;
  const limit = pageSize;
  return { page, pageSize, limit, offset };
}

export function addPagination(sql, params, pagination) {
  // Append LIMIT/OFFSET to SQL and push params
  return { sql: `${sql} LIMIT ? OFFSET ?`, params: [...params, pagination.limit, pagination.offset] };
}
