/**
 * API utility functions for making HTTP requests to the backend
 */

// API base URL - uses environment variable or defaults to localhost:3000
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Get authorization headers including the JWT token
 */
export function getAuthHeaders() {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Make an API request with automatic error handling
 * @param {string} endpoint - API endpoint (e.g., "/api/users")
 * @param {object} options - Fetch options
 * @returns {Promise<object>} - Response data
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: getAuthHeaders(),
    ...options,
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data?.error?.message || data?.error || "Request failed";
    throw new Error(errorMessage);
  }

  return data;
}

/**
 * GET request helper
 */
export async function get(endpoint) {
  return apiRequest(endpoint, { method: "GET" });
}

/**
 * POST request helper
 */
export async function post(endpoint, body) {
  return apiRequest(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * PUT request helper
 */
export async function put(endpoint, body) {
  return apiRequest(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

/**
 * DELETE request helper
 */
export async function del(endpoint) {
  return apiRequest(endpoint, { method: "DELETE" });
}

/**
 * Auth-specific API calls
 */
export const authApi = {
  login: (username, password) => post("/api/auth/login", { username, password }),
  logout: () => post("/api/auth/logout", {}),
  me: () => get("/api/auth/me"),
};

/**
 * Tickets API
 */
export const ticketsApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return get(`/api/tickets${query ? `?${query}` : ""}`);
  },
  get: (id) => get(`/api/tickets/${id}`),
  create: (data) => post("/api/tickets", data),
  update: (id, data) => put(`/api/tickets/${id}`, data),
  delete: (id) => del(`/api/tickets/${id}`),
  addViolation: (ticketId, violationTypeId) => 
    post(`/api/tickets/${ticketId}/violations`, { violation_type_id: violationTypeId }),
};

/**
 * Drivers API
 */
export const driversApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return get(`/api/drivers${query ? `?${query}` : ""}`);
  },
  get: (id) => get(`/api/drivers/${id}`),
  getByLicense: (licenseNumber) => get(`/api/drivers/license/${encodeURIComponent(licenseNumber)}`),
  create: (data) => post("/api/drivers", data),
  update: (id, data) => put(`/api/drivers/${id}`, data),
  getVehicles: (id) => get(`/api/drivers/${id}/vehicles`),
  getTickets: (id) => get(`/api/drivers/${id}/tickets`),
};

/**
 * Vehicles API
 */
export const vehiclesApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return get(`/api/vehicles${query ? `?${query}` : ""}`);
  },
  get: (id) => get(`/api/vehicles/${id}`),
  getByPlate: (plateNumber) => get(`/api/vehicles/plate/${encodeURIComponent(plateNumber)}`),
  create: (data) => post("/api/vehicles", data),
  update: (id, data) => put(`/api/vehicles/${id}`, data),
  getTickets: (id) => get(`/api/vehicles/${id}/tickets`),
};

/**
 * Violations API
 */
export const violationsApi = {
  list: () => get("/api/violations"),
  get: (id) => get(`/api/violations/${id}`),
  create: (data) => post("/api/violations", data),
  update: (id, data) => put(`/api/violations/${id}`, data),
};

/**
 * Users API
 */
export const usersApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return get(`/api/users${query ? `?${query}` : ""}`);
  },
  get: (id) => get(`/api/users/${id}`),
  create: (data) => post("/api/users", data),
  update: (id, data) => put(`/api/users/${id}`, data),
  delete: (id) => del(`/api/users/${id}`),
};

/**
 * Audit API
 */
export const auditApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return get(`/api/audit${query ? `?${query}` : ""}`);
  },
};

/**
 * System API
 */
export const systemApi = {
  getDbStatus: () => get("/api/system/db/status"),
  getConfig: (key) => get(`/api/system/config/${key}`),
  setConfig: (key, value) => put(`/api/system/config/${key}`, { value }),
};

/**
 * Backup API
 */
export const backupApi = {
  create: () => post("/api/backup", {}),
  getHistory: () => get("/api/backup/history"),
};

/**
 * Payments API
 */
export const paymentsApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return get(`/api/payments${query ? `?${query}` : ""}`);
  },
  get: (id) => get(`/api/payments/${id}`),
  create: (data) => post("/api/payments", data),
};

/**
 * LGU API
 */
export const lguApi = {
  list: () => get("/api/lgu"),
  get: (id) => get(`/api/lgu/${id}`),
  create: (data) => post("/api/lgu", data),
  update: (id, data) => put(`/api/lgu/${id}`, data),
};

/**
 * Roles API
 */
export const rolesApi = {
  list: () => get("/api/roles"),
};

export default {
  API_BASE_URL,
  getAuthHeaders,
  apiRequest,
  get,
  post,
  put,
  del,
  authApi,
  ticketsApi,
  driversApi,
  vehiclesApi,
  violationsApi,
  usersApi,
  auditApi,
  systemApi,
  backupApi,
  paymentsApi,
  lguApi,
  rolesApi,
};
