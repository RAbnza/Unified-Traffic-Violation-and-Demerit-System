-- System configuration key-value store
CREATE TABLE IF NOT EXISTS SystemConfig (
  config_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  `key` VARCHAR(100) NOT NULL UNIQUE,
  `value` VARCHAR(255) NOT NULL,
  description VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Seed default demerit threshold
INSERT INTO SystemConfig (`key`, `value`, description)
VALUES ('demerit_threshold', '10', 'Minimum points before suspension')
ON DUPLICATE KEY UPDATE `value`=VALUES(`value`), description=VALUES(description);
