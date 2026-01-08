import fs from "fs";
import logger from "../lib/logger.js";

export function getDbConfig() {
  const {
    DB_HOST = "localhost",
    DB_PORT = "3306",
    DB_USER = "root",
    DB_PASSWORD = "",
    DB_NAME = "dba_utvds",
    DB_SSL = "false",
    DB_SSL_CA_PATH = "",
    DB_POOL_SIZE = "10",
  } = process.env;

  const useSSL = String(DB_SSL).toLowerCase() === "true";
  let ssl = undefined;
  if (useSSL) {
    ssl = {};
    if (DB_SSL_CA_PATH) {
      try {
        ssl.ca = fs.readFileSync(DB_SSL_CA_PATH, "utf8");
      } catch (err) {
        logger.warn(
          `Could not read DB_SSL_CA_PATH at ${DB_SSL_CA_PATH}. Continuing without CA.`
        );
      }
    }
  }

  return {
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: Number(DB_POOL_SIZE) || 10,
    queueLimit: 0,
    ssl,
  };
}

export function getRootConnectionConfig() {
  const cfg = getDbConfig();
  // Root connection is same as DB config but without the database name
  const { database, ...rest } = cfg;
  return rest;
}
