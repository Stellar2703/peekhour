-- Migration: Add from_user_id and post_id columns to notifications table
USE test;

-- Check and add post_id column
SET @col_exists_post = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'test' AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'post_id');

SET @add_post_id = IF(@col_exists_post = 0, 
    'ALTER TABLE notifications ADD COLUMN post_id INT AFTER message;', 
    'SELECT "Column post_id already exists";');

PREPARE stmt FROM @add_post_id;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add from_user_id column
SET @col_exists_from = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'test' AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'from_user_id');

SET @add_from_user = IF(@col_exists_from = 0,
    'ALTER TABLE notifications ADD COLUMN from_user_id INT AFTER post_id;',
    'SELECT "Column from_user_id already exists";');

PREPARE stmt FROM @add_from_user;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign keys (will fail silently if they exist)
SET @fk_from_user = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = 'test' AND TABLE_NAME = 'notifications' AND CONSTRAINT_NAME = 'fk_notifications_from_user');

SET @add_fk_from = IF(@fk_from_user = 0,
    'ALTER TABLE notifications ADD CONSTRAINT fk_notifications_from_user FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL;',
    'SELECT "FK from_user_id already exists";');

PREPARE stmt FROM @add_fk_from;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_post = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = 'test' AND TABLE_NAME = 'notifications' AND CONSTRAINT_NAME = 'fk_notifications_post');

SET @add_fk_post = IF(@fk_post = 0,
    'ALTER TABLE notifications ADD CONSTRAINT fk_notifications_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;',
    'SELECT "FK post_id already exists";');

PREPARE stmt FROM @add_fk_post;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Show final structure
SELECT 'Migration complete' as status;
DESCRIBE notifications;
