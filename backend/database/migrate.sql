-- Add missing tables for PeekHour backend
-- This adds tables that don't exist in your current schema

USE test;

-- Posts Table (main content)
CREATE TABLE IF NOT EXISTS posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    content TEXT,
    media_url VARCHAR(500),
    media_type ENUM('photo', 'video', 'audio'),
    location VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    department_id INT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_location (city, state),
    INDEX idx_department (department_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- Department Members
CREATE TABLE IF NOT EXISTS department_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    department_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('admin', 'moderator', 'member') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_member (department_id, user_id),
    INDEX idx_department (department_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- Post Likes
CREATE TABLE IF NOT EXISTS post_likes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (post_id, user_id),
    INDEX idx_post (post_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- Post Shares
CREATE TABLE IF NOT EXISTS post_shares (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_share (post_id, user_id),
    INDEX idx_post (post_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- User Locations (saved/frequently used)
CREATE TABLE IF NOT EXISTS user_locations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    location VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    usage_count INT DEFAULT 1,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- Post Statistics View
CREATE OR REPLACE VIEW post_statistics AS
SELECT 
    p.id AS post_id,
    COUNT(DISTINCT pl.id) AS likes_count,
    COUNT(DISTINCT ps.id) AS shares_count,
    COUNT(DISTINCT c.id) AS comments_count
FROM posts p
LEFT JOIN post_likes pl ON p.id = pl.post_id
LEFT JOIN post_shares ps ON p.id = ps.post_id
LEFT JOIN comments c ON p.id = c.id AND c.is_deleted = FALSE
WHERE p.is_deleted = FALSE
GROUP BY p.id;

-- Department Statistics View
CREATE OR REPLACE VIEW department_statistics AS
SELECT 
    d.id AS department_id,
    COUNT(DISTINCT dm.id) AS members_count,
    COUNT(DISTINCT p.id) AS posts_count
FROM departments d
LEFT JOIN department_members dm ON d.id = dm.department_id
LEFT JOIN posts p ON d.id = p.department_id AND p.is_deleted = FALSE
GROUP BY d.id;

-- Update comments table if needed (check if id column should be post_id)
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS post_id INT,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_bold BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_italic BOOLEAN DEFAULT FALSE,
ADD INDEX IF NOT EXISTS idx_post (post_id);

-- Ensure notifications table has correct structure
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS type VARCHAR(50),
ADD COLUMN IF NOT EXISTS related_id INT,
ADD INDEX IF NOT EXISTS idx_user (id);

-- Success message
SELECT '✅ Database migration completed successfully!' AS status;
