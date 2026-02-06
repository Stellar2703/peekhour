-- ============================================
-- PEEKHOUR - COMPREHENSIVE FEATURE SCHEMA
-- ============================================

-- 1. USER PROFILE ENHANCEMENTS
-- ============================================

-- User settings table
CREATE TABLE user_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'en',
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    profile_visibility ENUM('public', 'followers', 'private') DEFAULT 'public',
    show_email BOOLEAN DEFAULT FALSE,
    show_mobile BOOLEAN DEFAULT FALSE,
    allow_messages ENUM('everyone', 'followers', 'nobody') DEFAULT 'everyone',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Privacy and blocking
CREATE TABLE blocked_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    blocked_user_id INT NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_block (user_id, blocked_user_id),
    INDEX idx_user_blocks (user_id),
    INDEX idx_blocked_user (blocked_user_id)
) ENGINE=InnoDB;

-- Follow system
CREATE TABLE follows (
    id INT PRIMARY KEY AUTO_INCREMENT,
    follower_id INT NOT NULL,
    following_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_follow (follower_id, following_id),
    INDEX idx_follower (follower_id),
    INDEX idx_following (following_id)
) ENGINE=InnoDB;

-- User profile updates (add columns to existing users table)
ALTER TABLE users
ADD COLUMN bio TEXT,
ADD COLUMN cover_photo VARCHAR(500),
ADD COLUMN website VARCHAR(500),
ADD COLUMN verified BOOLEAN DEFAULT FALSE,
ADD COLUMN account_type ENUM('personal', 'business', 'organization') DEFAULT 'personal';

-- ============================================
-- 2. ENHANCED POST FEATURES
-- ============================================

-- Post edits history
CREATE TABLE post_edits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    previous_content TEXT,
    edited_by INT NOT NULL,
    edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (edited_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_post (post_id)
) ENGINE=InnoDB;

-- Saved/Bookmarked posts
CREATE TABLE saved_posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    collection_name VARCHAR(100) DEFAULT 'Saved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_save (user_id, post_id),
    INDEX idx_user_saves (user_id)
) ENGINE=InnoDB;

-- Hashtags
CREATE TABLE hashtags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_usage (usage_count)
) ENGINE=InnoDB;

-- Post hashtags relationship
CREATE TABLE post_hashtags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    hashtag_id INT NOT NULL,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (hashtag_id) REFERENCES hashtags(id) ON DELETE CASCADE,
    UNIQUE KEY unique_post_hashtag (post_id, hashtag_id),
    INDEX idx_post (post_id),
    INDEX idx_hashtag (hashtag_id)
) ENGINE=InnoDB;

-- Mentions
CREATE TABLE mentions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT,
    comment_id INT,
    mentioned_user_id INT NOT NULL,
    mentioned_by_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (mentioned_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mentioned_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_mentioned (mentioned_user_id),
    INDEX idx_post (post_id),
    INDEX idx_comment (comment_id)
) ENGINE=InnoDB;

-- Polls
CREATE TABLE polls (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL UNIQUE,
    question TEXT NOT NULL,
    expires_at TIMESTAMP NULL,
    multiple_choice BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE poll_options (
    id INT PRIMARY KEY AUTO_INCREMENT,
    poll_id INT NOT NULL,
    option_text VARCHAR(255) NOT NULL,
    vote_count INT DEFAULT 0,
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
    INDEX idx_poll (poll_id)
) ENGINE=InnoDB;

CREATE TABLE poll_votes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    poll_option_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (poll_option_id) REFERENCES poll_options(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_vote (poll_option_id, user_id)
) ENGINE=InnoDB;

-- Post updates (add columns to existing posts table)
ALTER TABLE posts
ADD COLUMN visibility ENUM('public', 'followers', 'private') DEFAULT 'public',
ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN scheduled_at TIMESTAMP NULL,
ADD COLUMN edited_at TIMESTAMP NULL,
ADD COLUMN is_poll BOOLEAN DEFAULT FALSE;

-- Multiple reactions (replacing simple likes)
CREATE TABLE post_reactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    reaction_type ENUM('like', 'love', 'wow', 'sad', 'angry', 'celebrate') DEFAULT 'like',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_reaction (post_id, user_id),
    INDEX idx_post (post_id),
    INDEX idx_user (user_id),
    INDEX idx_type (reaction_type)
) ENGINE=InnoDB;

-- ============================================
-- 3. ADVANCED COMMENT SYSTEM
-- ============================================

-- Nested comments (update existing comments table)
ALTER TABLE comments
ADD COLUMN parent_comment_id INT NULL,
ADD COLUMN depth INT DEFAULT 0,
ADD COLUMN edited_at TIMESTAMP NULL,
ADD FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE;

-- Comment reactions
CREATE TABLE comment_reactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    comment_id INT NOT NULL,
    user_id INT NOT NULL,
    reaction_type ENUM('like', 'love', 'wow', 'sad', 'angry') DEFAULT 'like',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_comment_reaction (comment_id, user_id),
    INDEX idx_comment (comment_id)
) ENGINE=InnoDB;

-- ============================================
-- 4. MESSAGING SYSTEM
-- ============================================

-- Conversations
CREATE TABLE conversations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    is_group BOOLEAN DEFAULT FALSE,
    group_name VARCHAR(255),
    group_avatar VARCHAR(500),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Conversation participants
CREATE TABLE conversation_participants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    conversation_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP NULL,
    is_muted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_participant (conversation_id, user_id),
    INDEX idx_conversation (conversation_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- Messages
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    message_type ENUM('text', 'image', 'video', 'audio', 'file') DEFAULT 'text',
    content TEXT,
    media_url VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_conversation (conversation_id),
    INDEX idx_sender (sender_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- Typing indicators
CREATE TABLE typing_indicators (
    id INT PRIMARY KEY AUTO_INCREMENT,
    conversation_id INT NOT NULL,
    user_id INT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_typing (conversation_id, user_id)
) ENGINE=InnoDB;

-- ============================================
-- 5. DEPARTMENT IMPROVEMENTS
-- ============================================

-- Department updates (add columns)
ALTER TABLE departments
ADD COLUMN cover_image VARCHAR(500),
ADD COLUMN rules TEXT,
ADD COLUMN require_approval BOOLEAN DEFAULT FALSE,
ADD COLUMN member_level_enabled BOOLEAN DEFAULT FALSE;

-- Moderators (in addition to admin role)
CREATE TABLE department_moderators (
    id INT PRIMARY KEY AUTO_INCREMENT,
    department_id INT NOT NULL,
    user_id INT NOT NULL,
    permissions JSON,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INT NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_moderator (department_id, user_id)
) ENGINE=InnoDB;

-- Pending posts (require approval)
CREATE TABLE pending_posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    department_id INT NOT NULL,
    submitted_by INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    reviewed_by INT,
    reviewed_at TIMESTAMP NULL,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_department (department_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- Events
CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    department_id INT,
    created_by INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type ENUM('online', 'physical', 'hybrid') DEFAULT 'physical',
    location VARCHAR(500),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    cover_image VARCHAR(500),
    max_attendees INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_department (department_id),
    INDEX idx_start_time (start_time)
) ENGINE=InnoDB;

CREATE TABLE event_attendees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    status ENUM('going', 'maybe', 'not_going') DEFAULT 'going',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendee (event_id, user_id)
) ENGINE=InnoDB;

-- ============================================
-- 6. SECURITY & PRIVACY
-- ============================================

-- Two-factor authentication
CREATE TABLE two_factor_auth (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    secret VARCHAR(255) NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    backup_codes JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Login history
CREATE TABLE login_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    location VARCHAR(255),
    status ENUM('success', 'failed') DEFAULT 'success',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- Active sessions
CREATE TABLE active_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    device_info TEXT,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_token (session_token)
) ENGINE=InnoDB;

-- ============================================
-- 7. CONTENT MODERATION
-- ============================================

-- Reports
CREATE TABLE reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reported_by INT NOT NULL,
    report_type ENUM('post', 'comment', 'user', 'department', 'message') NOT NULL,
    reported_item_id INT NOT NULL,
    reason ENUM('spam', 'harassment', 'inappropriate', 'violence', 'hate_speech', 'misinformation', 'other') NOT NULL,
    description TEXT,
    status ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
    reviewed_by INT,
    reviewed_at TIMESTAMP NULL,
    action_taken TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_type (report_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- User bans/suspensions
CREATE TABLE user_bans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    banned_by INT NOT NULL,
    reason TEXT,
    ban_type ENUM('temporary', 'permanent') DEFAULT 'temporary',
    expires_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (banned_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- Moderation logs
CREATE TABLE moderation_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    moderator_id INT NOT NULL,
    action_type ENUM('delete_post', 'delete_comment', 'ban_user', 'warn_user', 'approve_post', 'reject_post', 'remove_content') NOT NULL,
    target_type ENUM('post', 'comment', 'user', 'department') NOT NULL,
    target_id INT NOT NULL,
    reason TEXT,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_moderator (moderator_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ============================================
-- 8. STORIES & EPHEMERAL CONTENT
-- ============================================

-- Stories
CREATE TABLE stories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    media_type ENUM('photo', 'video') NOT NULL,
    media_url VARCHAR(500) NOT NULL,
    caption TEXT,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_expires (expires_at),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- Story views
CREATE TABLE story_views (
    id INT PRIMARY KEY AUTO_INCREMENT,
    story_id INT NOT NULL,
    viewer_id INT NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    FOREIGN KEY (viewer_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_view (story_id, viewer_id),
    INDEX idx_story (story_id)
) ENGINE=InnoDB;

-- ============================================
-- 9. ANALYTICS
-- ============================================

-- Post analytics
CREATE TABLE post_analytics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    views INT DEFAULT 0,
    unique_views INT DEFAULT 0,
    reach INT DEFAULT 0,
    impressions INT DEFAULT 0,
    date DATE NOT NULL,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_post_date (post_id, date),
    INDEX idx_post (post_id),
    INDEX idx_date (date)
) ENGINE=InnoDB;

-- User analytics
CREATE TABLE user_analytics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    followers_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    posts_count INT DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0.00,
    date DATE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, date),
    INDEX idx_user (user_id),
    INDEX idx_date (date)
) ENGINE=InnoDB;

-- ============================================
-- 10. NOTIFICATION UPDATES
-- ============================================

-- Update notifications table with more types
ALTER TABLE notifications
ADD COLUMN notification_type ENUM('like', 'comment', 'share', 'follow', 'mention', 'department_invite', 'role_change', 'message', 'event', 'post_approval') DEFAULT 'like',
ADD COLUMN data JSON,
ADD COLUMN email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN push_sent BOOLEAN DEFAULT FALSE;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_posts_visibility ON posts(visibility);
CREATE INDEX idx_posts_scheduled ON posts(scheduled_at);
CREATE INDEX idx_posts_pinned ON posts(is_pinned);
CREATE INDEX idx_users_verified ON users(verified);
CREATE INDEX idx_users_account_type ON users(account_type);
