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
    let ticketId = null; // Will be set later
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

    // Update users with lgu_id
    await conn.execute("UPDATE User SET lgu_id = ? WHERE user_id IN (?, ?, ?, ?)", 
      [lguId, officerUserId, lguAdminUserId, lguStaffUserId, auditorUserId]);

    // 7) ViolationType - Add multiple violation types
    const violationTypes = [
      ["Overspeeding", "Exceeding posted speed limit", 1000.0, 3],
      ["Illegal Parking", "Parking in no-parking zone", 500.0, 1],
      ["Running Red Light", "Failing to stop at red traffic signal", 1500.0, 4],
      ["No Helmet", "Motorcycle rider without helmet", 750.0, 2],
      ["No Seatbelt", "Driver or passenger not wearing seatbelt", 500.0, 1],
      ["Driving Without License", "Operating vehicle without valid license", 3000.0, 6],
      ["Expired Registration", "Operating vehicle with expired registration", 2000.0, 2],
      ["Reckless Driving", "Driving in a reckless manner", 2500.0, 5],
      ["Illegal U-Turn", "Making U-turn in prohibited area", 500.0, 1],
      ["Obstruction", "Causing traffic obstruction", 750.0, 2],
    ];
    
    for (const [name, desc, fine, points] of violationTypes) {
      await conn.execute(
        `INSERT INTO ViolationType (name, description, fine_amount, demerit_point) 
         VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE description=VALUES(description), fine_amount=VALUES(fine_amount), demerit_point=VALUES(demerit_point)`,
        [name, desc, fine, points]
      );
    }
    
    let violationTypeId = await selectId(conn, "SELECT violation_type_id FROM ViolationType WHERE name=? LIMIT 1", ["Overspeeding"]);

    // Add more drivers
    const drivers = [
      ["D-0012345", "John", "Doe", "123 Main St", "1990-01-15", "+63-900-111-2222", "john.doe@example.com"],
      ["D-0023456", "Jane", "Smith", "456 Oak Ave", "1985-05-20", "+63-900-222-3333", "jane.smith@example.com"],
      ["D-0034567", "Robert", "Johnson", "789 Pine Rd", "1992-08-10", "+63-900-333-4444", "robert.j@example.com"],
      ["D-0045678", "Maria", "Garcia", "321 Elm St", "1988-12-25", "+63-900-444-5555", "maria.g@example.com"],
      ["D-0056789", "James", "Williams", "654 Cedar Ln", "1995-03-18", "+63-900-555-6666", "james.w@example.com"],
    ];
    
    const driverIds = [];
    for (const [license, first, last, addr, bday, phone, email] of drivers) {
      let id = await selectId(conn, "SELECT driver_id FROM Driver WHERE license_number=? LIMIT 1", [license]);
      if (!id) {
        const [res] = await conn.execute(
          "INSERT INTO Driver (license_number, first_name, last_name, address, birth_date, contact_number, email, license_status, demerit_points) VALUES (?,?,?,?,?,?,?, 'ACTIVE', 0)",
          [license, first, last, addr, bday, phone, email]
        );
        id = res.insertId;
      }
      driverIds.push(id);
    }
    driverId = driverIds[0];

    // Add more vehicles
    const vehicles = [
      ["ABC-1234", "Toyota", "Vios", 2020, "White", "Sedan", driverIds[0]],
      ["XYZ-5678", "Honda", "Civic", 2019, "Black", "Sedan", driverIds[1]],
      ["DEF-9012", "Mitsubishi", "Montero", 2021, "Silver", "SUV", driverIds[2]],
      ["GHI-3456", "Ford", "Ranger", 2018, "Red", "Pickup", driverIds[3]],
      ["JKL-7890", "Suzuki", "Swift", 2022, "Blue", "Hatchback", driverIds[4]],
      ["MNO-1357", "Toyota", "Fortuner", 2020, "Gray", "SUV", driverIds[0]],
    ];
    
    const vehicleIds = [];
    for (const [plate, make, model, year, color, type, ownerDriverId] of vehicles) {
      let id = await selectId(conn, "SELECT vehicle_id FROM Vehicle WHERE plate_number=? LIMIT 1", [plate]);
      if (!id) {
        const [res] = await conn.execute(
          "INSERT INTO Vehicle (plate_number, make, model, year, color, vehicle_type, driver_id) VALUES (?,?,?,?,?,?,?)",
          [plate, make, model, year, color, type, ownerDriverId]
        );
        id = res.insertId;
      }
      vehicleIds.push(id);
    }
    vehicleId = vehicleIds[0];

    // 8) Create multiple tickets
    const ticketData = [
      ["TKT-0001", "Main Ave & 1st St", "PAID", driverIds[0], vehicleIds[0]],
      ["TKT-0002", "Highway 5 KM 23", "OPEN", driverIds[1], vehicleIds[1]],
      ["TKT-0003", "Downtown Plaza", "OPEN", driverIds[2], vehicleIds[2]],
      ["TKT-0004", "City Hall Parking", "DISMISSED", driverIds[3], vehicleIds[3]],
      ["TKT-0005", "National Road", "OPEN", driverIds[4], vehicleIds[4]],
      ["TKT-0006", "Market Street", "PAID", driverIds[0], vehicleIds[5]],
      ["TKT-0007", "School Zone Area", "OPEN", driverIds[1], vehicleIds[1]],
      ["TKT-0008", "Intersection A", "OPEN", driverIds[2], vehicleIds[2]],
    ];
    
    const ticketIds = [];
    for (let i = 0; i < ticketData.length; i++) {
      const [ticketNum, location, status, dId, vId] = ticketData[i];
      let id = await selectId(conn, "SELECT ticket_id FROM Ticket WHERE ticket_number=? LIMIT 1", [ticketNum]);
      if (!id) {
        // Vary dates
        const date = new Date();
        date.setDate(date.getDate() - i * 3);
        const [res] = await conn.execute(
          "INSERT INTO Ticket (ticket_number, date_issued, time_issued, location, status, driver_id, vehicle_id, issued_by, lgu_id) VALUES (?,?,?,?,?,?,?,?,?)",
          [ticketNum, date.toISOString().slice(0, 10), date.toISOString().slice(11, 19), location, status, dId, vId, officerUserId, lguId]
        );
        id = res.insertId;
      }
      ticketIds.push(id);
    }
    ticketId = ticketIds[0];

    // 9) TicketViolation - assign violations to tickets
    const violationTypeIds = [];
    const [vtRows] = await conn.execute("SELECT violation_type_id FROM ViolationType ORDER BY violation_type_id LIMIT 10");
    vtRows.forEach(r => violationTypeIds.push(r.violation_type_id));
    
    for (let i = 0; i < ticketIds.length; i++) {
      const tId = ticketIds[i];
      const vTypeId = violationTypeIds[i % violationTypeIds.length];
      const [tvRows] = await conn.execute(
        "SELECT ticket_violation_id FROM TicketViolation WHERE ticket_id=? LIMIT 1",
        [tId]
      );
      if (tvRows.length === 0) {
        await conn.execute("INSERT INTO TicketViolation (ticket_id, violation_type_id) VALUES (?,?)", [tId, vTypeId]);
      }
    }

    // 10) Payment for paid tickets
    for (let i = 0; i < ticketData.length; i++) {
      if (ticketData[i][2] === "PAID") {
        const tId = ticketIds[i];
        const [payRows] = await conn.execute("SELECT payment_id FROM Payment WHERE ticket_id=? LIMIT 1", [tId]);
        if (payRows.length === 0) {
          const receiptNum = `RCT-${String(i + 1).padStart(4, "0")}`;
          await conn.execute(
            "INSERT INTO Payment (ticket_id, amount_paid, payment_date, payment_method, receipt_number, processed_by) VALUES (?,?,?,?,?,?)",
            [tId, 1000.0, new Date(), "CASH", receiptNum, lguStaffUserId]
          );
        }
      }
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
