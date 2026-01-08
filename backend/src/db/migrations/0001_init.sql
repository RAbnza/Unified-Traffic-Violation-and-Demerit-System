-- Initial schema for Unified Traffic Violation and Demerit System
-- Based on ERD: Role, User, OfficerAssignment, LGU, Ticket, TicketViolation,
-- ViolationType, Vehicle, Driver, Payment, AuditLog
-- MySQL 8+ compatible

-- 1) Role
CREATE TABLE IF NOT EXISTS Role (
  role_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  role_name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2) LGU (Local Government Unit)
CREATE TABLE IF NOT EXISTS LGU (
  lgu_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  province VARCHAR(100),
  region VARCHAR(100),
  contact_email VARCHAR(255),
  contact_number VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3) Driver
CREATE TABLE IF NOT EXISTS Driver (
  driver_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  license_number VARCHAR(64) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  address VARCHAR(255),
  birth_date DATE,
  contact_number VARCHAR(50),
  email VARCHAR(255),
  license_status ENUM('ACTIVE','SUSPENDED','REVOKED') NOT NULL DEFAULT 'ACTIVE',
  demerit_points INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4) Vehicle (owned by Driver)
CREATE TABLE IF NOT EXISTS Vehicle (
  vehicle_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  plate_number VARCHAR(32) NOT NULL UNIQUE,
  make VARCHAR(100),
  model VARCHAR(100),
  year SMALLINT,
  color VARCHAR(50),
  vehicle_type VARCHAR(50),
  driver_id BIGINT NOT NULL,
  CONSTRAINT fk_vehicle_driver FOREIGN KEY (driver_id)
    REFERENCES Driver(driver_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 5) User (has Role)
CREATE TABLE IF NOT EXISTS User (
  user_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  contact_number VARCHAR(50),
  role_id BIGINT NOT NULL,
  CONSTRAINT uq_user_username UNIQUE (username),
  CONSTRAINT uq_user_email UNIQUE (email),
  CONSTRAINT fk_user_role FOREIGN KEY (role_id)
    REFERENCES Role(role_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 6) OfficerAssignment (User <-> LGU)
CREATE TABLE IF NOT EXISTS OfficerAssignment (
  assignment_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  lgu_id BIGINT NOT NULL,
  date_assigned DATE NOT NULL,
  date_ended DATE NULL,
  status ENUM('ACTIVE','ENDED') NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT fk_assignment_user FOREIGN KEY (user_id)
    REFERENCES User(user_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_assignment_lgu FOREIGN KEY (lgu_id)
    REFERENCES LGU(lgu_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 7) ViolationType (catalog)
CREATE TABLE IF NOT EXISTS ViolationType (
  violation_type_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  description VARCHAR(255),
  fine_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  demerit_point INT NOT NULL DEFAULT 0,
  CONSTRAINT uq_violationtype_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 8) Ticket
CREATE TABLE IF NOT EXISTS Ticket (
  ticket_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ticket_number VARCHAR(64) NOT NULL,
  date_issued DATE NOT NULL,
  time_issued TIME NOT NULL,
  location VARCHAR(255),
  status ENUM('OPEN','PAID','DISMISSED') NOT NULL DEFAULT 'OPEN',
  driver_id BIGINT NOT NULL,
  vehicle_id BIGINT NOT NULL,
  issued_by BIGINT NOT NULL, -- user_id
  lgu_id BIGINT NOT NULL,
  CONSTRAINT uq_ticket_number UNIQUE (ticket_number),
  CONSTRAINT fk_ticket_driver FOREIGN KEY (driver_id)
    REFERENCES Driver(driver_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_ticket_vehicle FOREIGN KEY (vehicle_id)
    REFERENCES Vehicle(vehicle_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_ticket_issued_by FOREIGN KEY (issued_by)
    REFERENCES User(user_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_ticket_lgu FOREIGN KEY (lgu_id)
    REFERENCES LGU(lgu_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 9) TicketViolation (many violations per ticket)
CREATE TABLE IF NOT EXISTS TicketViolation (
  ticket_violation_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ticket_id BIGINT NOT NULL,
  violation_type_id BIGINT NOT NULL,
  CONSTRAINT fk_ticketviolation_ticket FOREIGN KEY (ticket_id)
    REFERENCES Ticket(ticket_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_ticketviolation_violation FOREIGN KEY (violation_type_id)
    REFERENCES ViolationType(violation_type_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 10) Payment
CREATE TABLE IF NOT EXISTS Payment (
  payment_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ticket_id BIGINT NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  payment_method VARCHAR(50),
  receipt_number VARCHAR(100),
  processed_by BIGINT, -- user_id
  CONSTRAINT uq_payment_receipt UNIQUE (receipt_number),
  CONSTRAINT fk_payment_ticket FOREIGN KEY (ticket_id)
    REFERENCES Ticket(ticket_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_payment_user FOREIGN KEY (processed_by)
    REFERENCES User(user_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 11) AuditLog
CREATE TABLE IF NOT EXISTS AuditLog (
  log_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT,
  action VARCHAR(100) NOT NULL,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  details TEXT,
  ip_address VARCHAR(64),
  affected_table_id BIGINT,
  affected_table VARCHAR(100),
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id)
    REFERENCES User(user_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Helpful indexes
CREATE INDEX idx_user_username ON User(username);
CREATE INDEX idx_driver_license ON Driver(license_number);
CREATE INDEX idx_vehicle_plate ON Vehicle(plate_number);
CREATE INDEX idx_ticket_number ON Ticket(ticket_number);
CREATE INDEX idx_ticket_status ON Ticket(status);
CREATE INDEX idx_ticket_driver ON Ticket(driver_id);
CREATE INDEX idx_ticket_lgu ON Ticket(lgu_id);
