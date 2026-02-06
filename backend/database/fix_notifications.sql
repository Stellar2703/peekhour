-- Add missing columns to notifications table

-- Add content column (alias for message for some controllers)
ALTER TABLE notifications ADD COLUMN content TEXT AFTER message;

-- Add post_id column
ALTER TABLE notifications ADD COLUMN post_id INT AFTER content;

-- Add comment_id column
ALTER TABLE notifications ADD COLUMN comment_id INT AFTER post_id;

-- Add indexes
ALTER TABLE notifications ADD INDEX idx_post (post_id);
ALTER TABLE notifications ADD INDEX idx_comment (comment_id);

SELECT '✅ Notifications table columns added!' AS status;
