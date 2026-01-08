import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { getDbConfig } from "../config/db.config.js";
import logger from "../lib/logger.js";
import { hashPassword } from "../lib/auth.js";

dotenv.config();

async function getConn() {
  return mysql.createConnection({ ...getDbConfig(), multipleStatements: true });
}

async function selectId(conn, sql, params) {
  const [rows] = await conn.execute(sql, params);
  if (rows.length > 0) return Object.values(rows[0])[0];
  return null;
}

async function upsertByUnique(conn, table, uniqueField, uniqueValue, data) {
  const fields = Object.keys(data);
  const placeholders = fields.map(() => "?").join(",");
  const update = fields.map((f) => `${f}=VALUES(${f})`).join(",");
  const sql = `INSERT INTO ${table} (${fields.join(",")}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${update}`;
  await conn.execute(sql, fields.map((f) => data[f]));
  // Fetch id after upsert using unique field
  const id = await selectId(conn, `SELECT ${table.slice(0,1).toLowerCase()+table.slice(1)}_id FROM ${table} WHERE ${uniqueField}=? LIMIT 1`, [uniqueValue]);
  return id;
}

async function run() {
  logger.log("Seeding sample data...");
  const conn = await getConn();
  try {
    await conn.beginTransaction();

    // 1) Roles
    const adminRoleId = await upsertByUnique(conn, "Role", "role_name", "Super Admin", {
      role_name: "Super Admin",
      description: "System administrator",
    });
    const officerRoleId = await upsertByUnique(conn, "Role", "role_name", "Officer", {
      role_name: "Officer",
      description: "Traffic enforcement officer",
    });
    const auditorRoleId = await upsertByUnique(conn, "Role", "role_name", "Auditor", {
      role_name: "Auditor",
      description: "System auditor",
    });
    const lguAdminRoleId = await upsertByUnique(conn, "Role", "role_name", "LGU Admin", {
      role_name: "LGU Admin",
      description: "Local Government Unit administrator",
    });
    const lguStaffRoleId = await upsertByUnique(conn, "Role", "role_name", "LGU Staff", {
      role_name: "LGU Staff",
      description: "LGU staff for payments/reports",
    });

    // 2) LGU (select-by-name then insert if missing)
    let lguId = await selectId(conn, "SELECT lgu_id FROM LGU WHERE name=? LIMIT 1", ["Metro City LGU"]);
    if (!lguId) {
      const [res] = await conn.execute(
        "INSERT INTO LGU (name, province, region, contact_email, contact_number) VALUES (?,?,?,?,?)",
        ["Metro City LGU", "Metro Province", "Region X", "contact@metro.example", "+63-900-000-0000"]
      );
      lguId = res.insertId;
    }

    // 3) Driver
    let driverId = await selectId(conn, "SELECT driver_id FROM Driver WHERE license_number=? LIMIT 1", ["D-0012345"]);
    if (!driverId) {
      const [res] = await conn.execute(
        "INSERT INTO Driver (license_number, first_name, last_name, address, birth_date, contact_number, email, license_status, demerit_points) VALUES (?,?,?,?,?,?,?,?,?)",
        [
          "D-0012345",
          "John",
          "Doe",
          "123 Main St",
          "1990-01-15",
          "+63-900-111-2222",
          "john.doe@example.com",
          "ACTIVE",
          0,
        ]
      );
      driverId = res.insertId;
    }

    // 4) Vehicle
    let vehicleId = await selectId(conn, "SELECT vehicle_id FROM Vehicle WHERE plate_number=? LIMIT 1", ["ABC-1234"]);
    if (!vehicleId) {
      const [res] = await conn.execute(
        "INSERT INTO Vehicle (plate_number, make, model, year, color, vehicle_type, driver_id) VALUES (?,?,?,?,?,?,?)",
        ["ABC-1234", "Toyota", "Vios", 2020, "White", "Sedan", driverId]
      );
      vehicleId = res.insertId;
    }

    // 5) Users
    let officerUserId = await selectId(conn, "SELECT user_id FROM User WHERE username=? LIMIT 1", ["officer1"]);
    if (!officerUserId) {
      const hashed = await hashPassword("password");
      const [res] = await conn.execute(
        "INSERT INTO User (username, password, first_name, last_name, email, contact_number, role_id) VALUES (?,?,?,?,?,?,?)",
        ["officer1", hashed, "Olivia", "Officer", "officer1@example.com", "+63-900-333-4444", officerRoleId]
      );
      officerUserId = res.insertId;
    }

    let adminUserId = await selectId(conn, "SELECT user_id FROM User WHERE username=? LIMIT 1", ["superadmin"]);
    if (!adminUserId) {
      const hashed = await hashPassword("password");
      const [res] = await conn.execute(
        "INSERT INTO User (username, password, first_name, last_name, email, contact_number, role_id) VALUES (?,?,?,?,?,?,?)",
        ["superadmin", hashed, "Alice", "SuperAdmin", "superadmin@example.com", "+63-900-555-6666", adminRoleId]
      );
      adminUserId = res.insertId;
    }

    // Auditor user
    let auditorUserId = await selectId(conn, "SELECT user_id FROM User WHERE username=? LIMIT 1", ["auditor"]);
    if (!auditorUserId) {
      const hashed = await hashPassword("password");
      const [res] = await conn.execute(
        "INSERT INTO User (username, password, first_name, last_name, email, contact_number, role_id) VALUES (?,?,?,?,?,?,?)",
        ["auditor", hashed, "Andy", "Auditor", "auditor@example.com", "+63-900-777-8888", auditorRoleId]
      );
      auditorUserId = res.insertId;
    }

    // LGU Admin user
    let lguAdminUserId = await selectId(conn, "SELECT user_id FROM User WHERE username=? LIMIT 1", ["lguadmin"]);
    if (!lguAdminUserId) {
      const hashed = await hashPassword("password");
      const [res] = await conn.execute(
        "INSERT INTO User (username, password, first_name, last_name, email, contact_number, role_id) VALUES (?,?,?,?,?,?,?)",
        ["lguadmin", hashed, "Lara", "LGUAdmin", "lguadmin@example.com", "+63-900-999-0000", lguAdminRoleId]
      );
      lguAdminUserId = res.insertId;
    }

    // LGU Staff user
    let lguStaffUserId = await selectId(conn, "SELECT user_id FROM User WHERE username=? LIMIT 1", ["lgustaff"]);
    if (!lguStaffUserId) {
      const hashed = await hashPassword("password");
      const [res] = await conn.execute(
        "INSERT INTO User (username, password, first_name, last_name, email, contact_number, role_id) VALUES (?,?,?,?,?,?,?)",
        ["lgustaff", hashed, "Sam", "LGUStaff", "lgustaff@example.com", "+63-901-111-2222", lguStaffRoleId]
      );
      lguStaffUserId = res.insertId;
    }

    // 6) OfficerAssignment
    const [assignRows] = await conn.execute(
      "SELECT assignment_id FROM OfficerAssignment WHERE user_id=? AND lgu_id=? AND status='ACTIVE' LIMIT 1",
      [officerUserId, lguId]
    );
    if (assignRows.length === 0) {
      await conn.execute(
        "INSERT INTO OfficerAssignment (user_id, lgu_id, date_assigned, status) VALUES (?,?,CURDATE(),'ACTIVE')",
        [officerUserId, lguId]
      );
    }

    // 7) ViolationType
    let violationTypeId = await selectId(conn, "SELECT violation_type_id FROM ViolationType WHERE name=? LIMIT 1", ["Overspeeding"]);
    if (!violationTypeId) {
      const [res] = await conn.execute(
        "INSERT INTO ViolationType (name, description, fine_amount, demerit_point) VALUES (?,?,?,?)",
        ["Overspeeding", "Exceeding posted speed limit", 1000.0, 3]
      );
      violationTypeId = res.insertId;
    }

    // 8) Ticket
    let ticketId = await selectId(conn, "SELECT ticket_id FROM Ticket WHERE ticket_number=? LIMIT 1", ["TKT-0001"]);
    if (!ticketId) {
      const [res2] = await conn.execute(
        "INSERT INTO Ticket (ticket_number, date_issued, time_issued, location, status, driver_id, vehicle_id, issued_by, lgu_id) VALUES (?,?,?,?,?,?,?,?,?)",
        [
          "TKT-0001",
          new Date().toISOString().slice(0, 10), // YYYY-MM-DD
          new Date().toISOString().slice(11, 19), // HH:MM:SS
          "Main Ave & 1st St",
          "OPEN",
          driverId,
          vehicleId,
          officerUserId,
          lguId,
        ]
      );
      ticketId = res2.insertId;
    }

    // 9) TicketViolation
    const [tvRows] = await conn.execute(
      "SELECT ticket_violation_id FROM TicketViolation WHERE ticket_id=? AND violation_type_id=? LIMIT 1",
      [ticketId, violationTypeId]
    );
    if (tvRows.length === 0) {
      await conn.execute(
        "INSERT INTO TicketViolation (ticket_id, violation_type_id) VALUES (?,?)",
        [ticketId, violationTypeId]
      );
    }

    // 10) Payment for the ticket (optional; creates one PAID example)
    const [payRows] = await conn.execute(
      "SELECT payment_id FROM Payment WHERE ticket_id=? LIMIT 1",
      [ticketId]
    );
    if (payRows.length === 0) {
      await conn.execute(
        "INSERT INTO Payment (ticket_id, amount_paid, payment_date, payment_method, receipt_number, processed_by) VALUES (?,?,?,?,?,?)",
        [ticketId, 1000.0, new Date(), "CASH", "RCT-0001", adminUserId]
      );
      await conn.execute("UPDATE Ticket SET status='PAID' WHERE ticket_id=?", [ticketId]);
    }

    await conn.commit();
    logger.success("Seed data applied successfully.");
  } catch (err) {
    await conn.rollback();
    logger.error("Seeding failed:", err.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

run().catch((e) => {
  logger.error(e);
  process.exit(1);
});
