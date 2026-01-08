-- Backup history table for tracking backups/restores
CREATE TABLE IF NOT EXISTS BackupHistory (
  backup_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  action ENUM('BACKUP','RESTORE') NOT NULL,
  status ENUM('SUCCESS','FAILED','IN_PROGRESS') NOT NULL DEFAULT 'SUCCESS',
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  triggered_by BIGINT NULL, -- user_id
  notes VARCHAR(255),
  CONSTRAINT fk_backup_user FOREIGN KEY (triggered_by)
    REFERENCES User(user_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
