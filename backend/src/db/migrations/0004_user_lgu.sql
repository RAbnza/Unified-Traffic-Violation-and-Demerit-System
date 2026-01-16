-- Add lgu_id to User table for officers assigned to LGUs
-- Note: Run this migration only once. If column already exists, it will error.

-- Add column (will fail if exists, which is ok for migration system)
ALTER TABLE User ADD COLUMN lgu_id BIGINT NULL AFTER role_id;

-- Add foreign key constraint
ALTER TABLE User ADD CONSTRAINT fk_user_lgu FOREIGN KEY (lgu_id) REFERENCES LGU(lgu_id) ON UPDATE CASCADE ON DELETE SET NULL;
