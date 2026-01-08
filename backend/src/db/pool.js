import mysql from "mysql2/promise";
import { getDbConfig } from "./config.js";

let pool;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      ...getDbConfig(),
      multipleStatements: false,
    });
  }
  return pool;
}

export async function testConnection() {
  const p = getPool();
  const [rows] = await p.query("SELECT 1 AS ok");
  return rows?.[0]?.ok === 1;
}

export async function pingDetails() {
  const p = getPool();
  const [rows] = await p.query("SELECT @@version AS version, DATABASE() AS db");
  return {
    ok: true,
    version: rows?.[0]?.version,
    database: rows?.[0]?.db,
  };
}
