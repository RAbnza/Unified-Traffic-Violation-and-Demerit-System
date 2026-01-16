import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { getDbConfig } from "../config/db.config.js";
import logger from "../lib/logger.js";
import { hashPassword } from "../lib/auth.js";

dotenv.config();

// Configuration for Data Volume
const CONFIG = {
  DRIVERS_COUNT: 55,       // 50+ records
  VEHICLES_COUNT: 60,      // 50+ records
  TICKETS_COUNT: 45,       // 40+ records
  PAYMENT_RATIO: 0.7,      // Approx 70% of tickets will be paid
  LGUS_TO_GENERATE: 10,    // 10 LGUs
  OFFICERS_PER_LGU: 3,     // 3 * 10 = 30 officers
  STAFF_PER_LGU: 4         // 4 * 10 = 40 staff
};

async function getConn() {
  return mysql.createConnection({ ...getDbConfig(), multipleStatements: true });
}

// Helper: Get a random element from an array
function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper: Get random date within last year
function getRandomDate(start = new Date(2025, 0, 1), end = new Date()) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function run() {
  logger.log("Initializing Comprehensive Database Seeding for Unified Traffic Violation System...");
  logger.log("Context: Philippine Local Government Units (LGUs)");
  
  const conn = await getConn();
  const passwordHash = await hashPassword("password"); // Uniform password for testing

  try {
    await conn.beginTransaction();

    // ---------------------------------------------------------
    // 1. ROLES & SYSTEM CONFIGURATION
    // ---------------------------------------------------------
    logger.info("--> Seeding Roles and System Configuration...");
    
    // Using ON DUPLICATE KEY UPDATE to ensure idempotency
    const rolesData = [
      [1, "Super Admin", "Central system administrator with full access"],
      [2, "Officer", "Field traffic enforcement officer who issues tickets"],
      [3, "Auditor", "Compliance officer with read-only access to logs"],
      [4, "LGU Admin", "Administrator for a specific Local Government Unit"],
      [5, "LGU Staff", "Back-office staff for payment processing and reports"]
    ];

    for (const [id, name, desc] of rolesData) {
      await conn.execute(
        `INSERT INTO Role (role_id, role_name, description) VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE role_name=VALUES(role_name), description=VALUES(description)`,
        [id, name, desc]
      );
    }

    // Default Demerit Threshold
    await conn.execute(
      `INSERT INTO SystemConfig (\`key\`, \`value\`, description) 
       VALUES ('demerit_threshold', '10', 'Suspension threshold according to RA 10930') 
       ON DUPLICATE KEY UPDATE \`value\`=VALUES(\`value\`)`
    );

    // ---------------------------------------------------------
    // 2. LOCAL GOVERNMENT UNITS (10 Distinct Metro/Regional Cities)
    // ---------------------------------------------------------
    logger.info(`--> Seeding ${CONFIG.LGUS_TO_GENERATE} Local Government Units...`);
    
    const phCities = [
      ["City of Manila", "Metro Manila", "NCR", "admin@manila.gov.ph", "(02) 8527-0900"],
      ["Quezon City LGU", "Metro Manila", "NCR", "traffic@quezoncity.gov.ph", "(02) 8988-4242"],
      ["Makati City Hall", "Metro Manila", "NCR", "mapsa@makati.gov.ph", "(02) 8870-1000"],
      ["Taguig City", "Metro Manila", "NCR", "tmo@taguig.gov.ph", "(02) 8555-7800"],
      ["Pasig City Traffic", "Metro Manila", "NCR", "tpmo@pasig.gov.ph", "(02) 8643-1111"],
      ["Cebu City LGU", "Cebu", "Region VII", "ccto@cebucity.gov.ph", "(032) 255-6984"],
      ["Davao City Govt", "Davao del Sur", "Region XI", "cttmo@davaocity.gov.ph", "(082) 224-1313"],
      ["Mandaluyong City", "Metro Manila", "NCR", "traffic@mandaluyong.gov.ph", "(02) 8532-5001"],
      ["San Juan City", "Metro Manila", "NCR", "pos@sanjuan.gov.ph", "(02) 8723-8813"],
      ["Marikina City", "Metro Manila", "NCR", "mctmo@marikina.gov.ph", "(02) 8646-2360"]
    ];

    // Cache LGU IDs for mapping users later
    const lguMap = []; 

    for (const [name, prov, reg, email, contact] of phCities) {
      await conn.execute(
        `INSERT INTO LGU (name, province, region, contact_email, contact_number) VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=name`, 
        [name, prov, reg, email, contact]
      );
      
      const [rows] = await conn.execute("SELECT lgu_id FROM LGU WHERE name = ? LIMIT 1", [name]);
      lguMap.push({ id: rows[0].lgu_id, name });
    }

    // ---------------------------------------------------------
    // 3. VIOLATION TYPES (Philippine Context - LTO/MMDA style)
    // ---------------------------------------------------------
    logger.info("--> Seeding Violation Catalog...");

    const violationCatalog = [
      ["Disregarding Traffic Sign", "Failure to follow traffic signage", 150.00, 1],
      ["Number Coding Violation", "Driving prohibited vehicle during peak hours", 300.00, 1],
      ["Overspeeding", "Exceeding imposed speed limits", 1200.00, 3],
      ["Reckless Driving", "Driving without regard for safety", 2000.00, 5],
      ["No Helmet", "Failure to wear standard protective helmet", 1500.00, 2],
      ["Driving Without License", "Operating a vehicle with no valid license", 3000.00, 5],
      ["Illegal Parking", "Parking in a tow-away or prohibited zone", 1000.00, 1],
      ["Obstruction of Traffic", "Blocking free flow of traffic", 500.00, 1],
      ["Seat Belt Law", "Failure to wear seat belt", 1000.00, 1],
      ["Distracted Driving", "Using mobile phone while driving", 5000.00, 4]
    ];

    for (const [name, desc, fine, points] of violationCatalog) {
      await conn.execute(
        `INSERT INTO ViolationType (name, description, fine_amount, demerit_point) 
         VALUES (?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE fine_amount=VALUES(fine_amount)`,
        [name, desc, fine, points]
      );
    }

    // ---------------------------------------------------------
    // 4. USERS & OFFICER ASSIGNMENTS
    // ---------------------------------------------------------
    // Requirements: 1 Super Admin, 1 Auditor, 30+ Officers, 40+ Staff
    logger.info("--> Seeding User Accounts & Officer Assignments...");

    const userQueries = [];
    const assignmentQueries = [];

    // Helper to insert user and get ID
    const createUser = async (username, first, last, email, roleId, lguId = null) => {
      // Create User
      const [uRes] = await conn.execute(
        `INSERT INTO User (username, password, first_name, last_name, email, contact_number, role_id, lgu_id) 
         VALUES (?, ?, ?, ?, ?, '+639170000000', ?, ?)
         ON DUPLICATE KEY UPDATE role_id=VALUES(role_id)`,
        [username, passwordHash, first, last, email, roleId, lguId]
      );
      
      let userId = uRes.insertId;
      if (userId === 0) { // If update happened, fetch ID
        const [rows] = await conn.execute("SELECT user_id FROM User WHERE username = ?", [username]);
        userId = rows[0].user_id;
      }
      return userId;
    };

    // 4.1. Core Admins
    await createUser("superadmin", "Juan", "Dela Cruz", "admin@central.gov.ph", 1, null);
    await createUser("auditor", "Maria", "Santos", "audit@coa.gov.ph", 3, null);

    const lguStaffIds = []; // Cache for payment processing
    const officerIds = [];  // Cache for ticket issuance

    // 4.2. LGU Specific Users (Admins, Officers, Staff)
    // Loop through 10 LGUs
    for (const lgu of lguMap) {
      const cityTag = lgu.name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');

      // A. Create LGU Admin (1 per LGU)
      await createUser(
        `admin_${cityTag}`, 
        "Admin", 
        lgu.name.split(' ')[0], 
        `admin.${cityTag}@lgu.ph`, 
        4, 
        lgu.id
      );

      // B. Create Officers (Configured amount: 3 per LGU)
      for (let i = 1; i <= CONFIG.OFFICERS_PER_LGU; i++) {
        const username = `officer_${cityTag}${i}`;
        const uid = await createUser(
          username, 
          "Officer", 
          `${cityTag.toUpperCase()}-${i}`, 
          `${username}@lgu.ph`, 
          2, 
          lgu.id
        );
        
        officerIds.push({ userId: uid, lguId: lgu.id });

        // Create Active Assignment
        await conn.execute(
          `INSERT INTO OfficerAssignment (user_id, lgu_id, date_assigned, status) 
           VALUES (?, ?, CURDATE(), 'ACTIVE')
           ON DUPLICATE KEY UPDATE status='ACTIVE'`, 
           [uid, lgu.id]
        );
      }

      // C. Create Staff (Configured amount: 4 per LGU)
      for (let i = 1; i <= CONFIG.STAFF_PER_LGU; i++) {
        const username = `staff_${cityTag}${i}`;
        const uid = await createUser(
          username, 
          "Staff", 
          `${cityTag.toUpperCase()}-${i}`, 
          `${username}@lgu.ph`, 
          5, 
          lgu.id
        );
        lguStaffIds.push({ userId: uid, lguId: lgu.id });
      }
    }

    // ---------------------------------------------------------
    // 5. DRIVERS (50+ Records - Realistic PH Profiles)
    // ---------------------------------------------------------
    logger.info(`--> Seeding ${CONFIG.DRIVERS_COUNT} Driver Records...`);
    
    const driverFirstNames = ["Jose", "Maria", "Juan", "Pedro", "Antonio", "Luis", "Angel", "Miguel", "Andrea", "Sofia", "Gabriel", "Ramon", "Fernando", "Elena", "Clara"];
    const driverLastNames = ["Garcia", "Reyes", "Cruz", "Santos", "Flores", "Gonzales", "Bautista", "Villanueva", "Ramos", "Castro", "Rivera", "Mendoza", "Yap", "Tan", "Sy"];
    
    const driversCache = []; // { id, license }

    for (let i = 1; i <= CONFIG.DRIVERS_COUNT; i++) {
      const fname = getRandom(driverFirstNames);
      const lname = getRandom(driverLastNames);
      // PH License format approximation: L02-XX-XXXXXX
      const licenseNo = `L02-${Math.floor(10 + Math.random()*89)}-${Math.floor(100000 + Math.random()*900000)}`;
      
      const [res] = await conn.execute(
        `INSERT INTO Driver (license_number, first_name, last_name, address, birth_date, contact_number, email, license_status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
        [
          licenseNo,
          fname, 
          lname, 
          `${Math.floor(Math.random() * 900)} Sampaguita St, Metro Manila`,
          "1990-01-01", 
          `0917${Math.floor(1000000 + Math.random()*9000000)}`,
          `driver${i}@email.com`
        ]
      );
      driversCache.push(res.insertId);
    }

    // ---------------------------------------------------------
    // 6. VEHICLES (50+ Records - Linked to Drivers)
    // ---------------------------------------------------------
    logger.info(`--> Seeding ${CONFIG.VEHICLES_COUNT} Vehicle Records...`);
    
    const carMakes = ["Toyota", "Mitsubishi", "Honda", "Nissan", "Suzuki", "Isuzu", "Hyundai"];
    const carModels = ["Vios", "Mirage", "Wigo", "Fortuner", "Montero", "Innova", "City", "Civic", "Accent"];
    const colors = ["White", "Black", "Silver", "Red", "Gray", "Blue"];
    const vehiclesCache = []; // { id, driverId }

    for (let i = 1; i <= CONFIG.VEHICLES_COUNT; i++) {
      // Plate Number: ABC 1234
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const plate = 
        letters.charAt(Math.floor(Math.random() * 26)) +
        letters.charAt(Math.floor(Math.random() * 26)) +
        letters.charAt(Math.floor(Math.random() * 26)) + "-" +
        Math.floor(100 + Math.random() * 9000); // 3 or 4 digits

      const ownerId = getRandom(driversCache);

      const [res] = await conn.execute(
        `INSERT INTO Vehicle (plate_number, make, model, year, color, vehicle_type, driver_id) 
         VALUES (?, ?, ?, ?, ?, 'Sedan', ?)`,
        [
          plate, 
          getRandom(carMakes), 
          getRandom(carModels), 
          2015 + Math.floor(Math.random() * 8), 
          getRandom(colors), 
          ownerId
        ]
      );
      vehiclesCache.push({ vehicleId: res.insertId, driverId: ownerId });
    }

    // ---------------------------------------------------------
    // 7. TICKETS & VIOLATIONS (40+ Records)
    // ---------------------------------------------------------
    logger.info(`--> Seeding ${CONFIG.TICKETS_COUNT} Traffic Tickets...`);
    
    const [vTypes] = await conn.execute("SELECT * FROM ViolationType");
    const ticketsCache = [];

    for (let i = 1; i <= CONFIG.TICKETS_COUNT; i++) {
      // 1. Pick an officer (this determines the LGU)
      const officer = getRandom(officerIds); // { userId, lguId }
      
      // 2. Pick a vehicle (this determines the driver)
      const vehicle = getRandom(vehiclesCache); // { vehicleId, driverId }

      // 3. Ticket Number: TKT-YYYYMMDD-XXXX
      const tktNum = `TKT-${new Date().getFullYear()}-${String(i).padStart(4, '0')}`;
      
      // 4. Status distribution
      const randStatus = Math.random();
      let status = "OPEN";
      if (randStatus > 0.3) status = "PAID"; // 70% paid for Payment data
      else if (randStatus < 0.05) status = "DISMISSED";

      const tktDate = getRandomDate();

      // Insert Ticket
      const [tRes] = await conn.execute(
        `INSERT INTO Ticket (ticket_number, date_issued, time_issued, location, status, driver_id, vehicle_id, issued_by, lgu_id) 
         VALUES (?, ?, ?, 'Edsa corner Shaw Blvd', ?, ?, ?, ?, ?)`,
        [
          tktNum, 
          tktDate, 
          `${Math.floor(Math.random()*24)}:${Math.floor(Math.random()*60)}:00`,
          status,
          vehicle.driverId,
          vehicle.vehicleId,
          officer.userId,
          officer.lguId
        ]
      );

      const ticketId = tRes.insertId;
      ticketsCache.push({ id: ticketId, status: status, lguId: officer.lguId, fine: 0, date: tktDate });

      // Insert 1 or 2 Violations per ticket
      const numViolations = Math.random() > 0.8 ? 2 : 1; 
      let ticketTotalFine = 0;
      let ticketPoints = 0;

      for (let v = 0; v < numViolations; v++) {
        const violation = getRandom(vTypes);
        await conn.execute(
          `INSERT INTO TicketViolation (ticket_id, violation_type_id) VALUES (?, ?)`,
          [ticketId, violation.violation_type_id]
        );
        ticketTotalFine += parseFloat(violation.fine_amount);
        ticketPoints += parseInt(violation.demerit_point);
      }

      // Update Driver Demerits
      await conn.execute(
        `UPDATE Driver SET demerit_points = demerit_points + ? WHERE driver_id = ?`,
        [ticketPoints, vehicle.driverId]
      );
      
      // Check suspension threshold
      const threshold = 10;
      const [dInfo] = await conn.execute("SELECT demerit_points FROM Driver WHERE driver_id=?", [vehicle.driverId]);
      if(dInfo[0].demerit_points >= threshold) {
         await conn.execute("UPDATE Driver SET license_status='SUSPENDED' WHERE driver_id=?", [vehicle.driverId]);
      }
      
      // Update ticket amount in memory for payment
      ticketsCache[ticketsCache.length-1].fine = ticketTotalFine;
    }

    // ---------------------------------------------------------
    // 8. PAYMENTS (For Paid Tickets)
    // ---------------------------------------------------------
    logger.info("--> Seeding Payment Transactions...");
    
    let paymentCount = 0;
    for (const tkt of ticketsCache) {
      if (tkt.status === 'PAID') {
        // Find a staff member belonging to the same LGU as the ticket
        const staff = lguStaffIds.find(s => s.lguId === tkt.lguId) || lguStaffIds[0];
        
        await conn.execute(
          `INSERT INTO Payment (ticket_id, amount_paid, payment_date, payment_method, receipt_number, processed_by) 
           VALUES (?, ?, ?, 'CASH', ?, ?)`,
          [
             tkt.id, 
             tkt.fine, 
             tkt.date, // Payment same day as issue for simplicity, or add minimal offset
             `RCT-${tkt.id}-${Math.floor(Math.random() * 10000)}`,
             staff.userId
          ]
        );
        paymentCount++;
      }
    }

    // ---------------------------------------------------------
    // 9. AUDIT LOGS (Samples)
    // ---------------------------------------------------------
    logger.info("--> Seeding Sample Audit Logs...");
    
    const actions = ["LOGIN_SUCCESS", "TICKET_CREATE", "PAYMENT_PROCESSED", "DRIVER_UPDATE"];
    for(let i=0; i<50; i++) {
       const user = getRandom(lguStaffIds) || {userId: 1};
       await conn.execute(
         `INSERT INTO AuditLog (user_id, action, timestamp, details, ip_address) 
          VALUES (?, ?, NOW() - INTERVAL ? HOUR, 'System simulated activity', '192.168.1.100')`,
         [user.userId, getRandom(actions), Math.floor(Math.random()*100)]
       );
    }

    await conn.commit();
    
    console.log("----------------------------------------------------------------");
    logger.success("SEEDING COMPLETE: Database successfully populated.");
    logger.info(`Summary Created:`);
    logger.info(` - LGUs: 10`);
    logger.info(` - Officers: ${officerIds.length}`);
    logger.info(` - Admin/Staff: ${1 + 1 + lguMap.length + lguStaffIds.length}`);
    logger.info(` - Drivers: ${CONFIG.DRIVERS_COUNT}`);
    logger.info(` - Vehicles: ${CONFIG.VEHICLES_COUNT}`);
    logger.info(` - Tickets: ${CONFIG.TICKETS_COUNT}`);
    logger.info(` - Payments: ${paymentCount}`);
    console.log("----------------------------------------------------------------");
    
  } catch (err) {
    await conn.rollback();
    logger.error("Seeding Failed! Rolling back changes...");
    logger.error(err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

// Execute
run().catch((e) => {
  logger.error("Fatal Error:", e);
  process.exit(1);
});