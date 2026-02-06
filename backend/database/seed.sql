-- PeekHour Sample Data Seed Script
-- This script will populate the database with sample data for testing

-- Clear existing data (be careful in production!)
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE post_hashtags;
TRUNCATE TABLE hashtags;
TRUNCATE TABLE post_reactions;
TRUNCATE TABLE comment_reactions;
TRUNCATE TABLE comments;
TRUNCATE TABLE post_shares;
TRUNCATE TABLE notifications;
TRUNCATE TABLE follows;
TRUNCATE TABLE blocked_users;
TRUNCATE TABLE department_members;
TRUNCATE TABLE posts;
TRUNCATE TABLE departments;
TRUNCATE TABLE user_locations;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

-- Insert sample users (all passwords: password123)
INSERT INTO users (name, username, email, mobile_number, password_hash, profile_avatar, bio, is_active) VALUES
('John Doe', 'johndoe', 'john@example.com', '1234567890', '$2a$10$TGrnDhNeOrxRJCe5xMD9duVP1B1WsvT/PDd/dWgjWQdPI6TFtqOam', 'JD', 'Software developer passionate about coding and coffee ☕', TRUE),
('Jane Smith', 'janesmith', 'jane@example.com', '1234567891', '$2a$10$TGrnDhNeOrxRJCe5xMD9duVP1B1WsvT/PDd/dWgjWQdPI6TFtqOam', 'JS', 'Product designer | UX enthusiast | Cat mom 🐱', TRUE),
('Mike Johnson', 'mikej', 'mike@example.com', '1234567892', '$2a$10$TGrnDhNeOrxRJCe5xMD9duVP1B1WsvT/PDd/dWgjWQdPI6TFtqOam', 'MJ', 'Digital nomad 🌍 | Travel blogger', TRUE),
('Sarah Williams', 'sarahw', 'sarah@example.com', '1234567893', '$2a$10$TGrnDhNeOrxRJCe5xMD9duVP1B1WsvT/PDd/dWgjWQdPI6TFtqOam', 'SW', 'Fitness coach | Nutrition expert 💪', TRUE),
('Alex Brown', 'alexb', 'alex@example.com', '1234567894', '$2a$10$TGrnDhNeOrxRJCe5xMD9duVP1B1WsvT/PDd/dWgjWQdPI6TFtqOam', 'AB', 'Photographer 📸 | Visual storyteller', TRUE),
('Emily Davis', 'emilyd', 'emily@example.com', '1234567895', '$2a$10$TGrnDhNeOrxRJCe5xMD9duVP1B1WsvT/PDd/dWgjWQdPI6TFtqOam', 'ED', 'Food blogger | Chef in training 👨‍🍳', TRUE),
('Chris Wilson', 'chrisw', 'chris@example.com', '1234567896', '$2a$10$TGrnDhNeOrxRJCe5xMD9duVP1B1WsvT/PDd/dWgjWQdPI6TFtqOam', 'CW', 'Music producer | DJ | Vinyl collector 🎵', TRUE),
('Lisa Anderson', 'lisaa', 'lisa@example.com', '1234567897', '$2a$10$TGrnDhNeOrxRJCe5xMD9duVP1B1WsvT/PDd/dWgjWQdPI6TFtqOam', 'LA', 'Marketing specialist | Brand strategist', TRUE),
('David Martinez', 'davidm', 'david@example.com', '1234567898', '$2a$10$TGrnDhNeOrxRJCe5xMD9duVP1B1WsvT/PDd/dWgjWQdPI6TFtqOam', 'DM', 'Entrepreneur | Startup founder 🚀', TRUE),
('Rachel Taylor', 'rachelt', 'rachel@example.com', '1234567899', '$2a$10$TGrnDhNeOrxRJCe5xMD9duVP1B1WsvT/PDd/dWgjWQdPI6TFtqOam', 'RT', 'Writer | Book lover | Coffee addict ☕📚', TRUE);

-- Insert user locations
INSERT INTO user_locations (user_id, country, state, city, area, street, last_used_at) VALUES
(1, 'USA', 'NY', 'New York', 'Manhattan', 'Main St', NOW()),
(2, 'USA', 'CA', 'Los Angeles', 'Downtown', 'Oak Ave', NOW()),
(3, 'UK', 'England', 'London', 'Westminster', 'High St', NOW()),
(4, 'France', 'Île-de-France', 'Paris', 'Marais', 'Rue de Paris', NOW()),
(5, 'Japan', 'Tokyo', 'Tokyo', 'Shibuya', 'Shibuya Crossing', NOW());

-- Insert departments
INSERT INTO departments (name, type, description, created_by, location, city, state, country, is_active) VALUES
('Tech Enthusiasts', 'community', 'A community for technology lovers, developers, and innovators', 1, '123 Main St, New York, NY', 'New York', 'NY', 'USA', TRUE),
('Foodies NYC', 'community', 'Discover the best food spots in New York City', 6, '456 Food St, New York, NY', 'New York', 'NY', 'USA', TRUE),
('LA Fitness Club', 'community', 'Fitness enthusiasts in Los Angeles area', 4, '789 Fitness Blvd, Los Angeles, CA', 'Los Angeles', 'CA', 'USA', TRUE),
('Photography Hub', 'community', 'Share your best shots and learn from professionals', 5, '321 Camera Ln, London, England', 'London', 'England', 'UK', TRUE),
('Startup Founders', 'community', 'Connect with fellow entrepreneurs and share insights', 9, '555 Startup Ave, San Francisco, CA', 'San Francisco', 'CA', 'USA', TRUE),
('Coffee Lovers', 'community', 'For those who take their coffee seriously', 10, '888 Coffee St, Seattle, WA', 'Seattle', 'WA', 'USA', TRUE);

-- Insert department members
INSERT INTO department_members (department_id, user_id, role) VALUES
-- Tech Enthusiasts
(1, 1, 'admin'), (1, 2, 'member'), (1, 3, 'member'), (1, 5, 'moderator'), (1, 9, 'member'),
-- Foodies NYC
(2, 6, 'admin'), (2, 1, 'member'), (2, 2, 'member'), (2, 10, 'member'),
-- LA Fitness Club
(3, 4, 'admin'), (3, 2, 'member'), (3, 8, 'member'),
-- Photography Hub
(4, 5, 'admin'), (4, 3, 'member'), (4, 1, 'member'), (4, 7, 'member'),
-- Startup Founders
(5, 9, 'admin'), (5, 1, 'member'), (5, 8, 'member'),
-- Coffee Lovers
(6, 10, 'admin'), (6, 1, 'member'), (6, 6, 'member'), (6, 7, 'member');

-- Insert follows
INSERT INTO follows (follower_id, following_id) VALUES
(1, 2), (1, 3), (1, 5), (1, 9),
(2, 1), (2, 6), (2, 4),
(3, 1), (3, 5), (3, 7),
(4, 2), (4, 8),
(5, 1), (5, 3), (5, 4),
(6, 1), (6, 2), (6, 10),
(7, 3), (7, 5),
(8, 4), (8, 9),
(9, 1), (9, 8),
(10, 1), (10, 6), (10, 7);

-- Insert posts
INSERT INTO posts (user_id, department_id, content, media_url, media_type, latitude, longitude, country, state, city, post_date, visibility, is_active) VALUES
(1, 1, 'Just deployed my first full-stack app! 🚀 Check it out and let me know what you think. Built with React, Node.js, and PostgreSQL.', NULL, 'none', 40.7128, -74.0060, 'USA', 'NY', 'New York', CURDATE(), 'public', TRUE),
(2, 1, 'Anyone else excited about the new React 19 features? The new compiler is a game changer!', NULL, 'none', 34.0522, -118.2437, 'USA', 'CA', 'Los Angeles', CURDATE(), 'public', TRUE),
(3, NULL, 'Beautiful sunset at the beach today 🌅 #photography #sunset', '/uploads/posts/sunset.jpg', 'photo', 51.5074, -0.1278, 'UK', 'England', 'London', CURDATE(), 'public', TRUE),
(4, 3, 'Just finished a 10K run! Feeling amazing 💪 New personal record: 52 minutes!', '/uploads/posts/run.jpg', 'photo', 34.0522, -118.2437, 'USA', 'CA', 'Los Angeles', CURDATE(), 'public', TRUE),
(5, 4, 'Golden hour photography tips: The best time is 30 minutes before sunset. Here''s my latest shot!', '/uploads/posts/golden_hour.jpg', 'photo', 51.5074, -0.1278, 'UK', 'England', 'London', CURDATE(), 'public', TRUE),
(6, 2, 'Found this amazing Italian restaurant in Little Italy! Best carbonara I''ve ever had 🍝', '/uploads/posts/carbonara.jpg', 'photo', 40.7128, -74.0060, 'USA', 'NY', 'New York', CURDATE(), 'public', TRUE),
(7, NULL, 'New music track dropping this weekend! Been working on this for months. Can''t wait to share it with you all 🎵', NULL, 'none', 40.7128, -74.0060, 'USA', 'NY', 'New York', CURDATE(), 'public', TRUE),
(8, 1, 'Tips for growing your startup: 1) Focus on product-market fit 2) Build a great team 3) Listen to your customers', NULL, 'none', 34.0522, -118.2437, 'USA', 'CA', 'Los Angeles', CURDATE(), 'public', TRUE),
(9, 5, 'Just closed our seed round! 🎉 Excited to announce $2M in funding. Here''s to building something amazing!', NULL, 'none', 37.7749, -122.4194, 'USA', 'CA', 'San Francisco', CURDATE(), 'public', TRUE),
(10, 6, 'Coffee brewing guide: Pour-over vs French Press - which is your favorite? Drop your thoughts below!', '/uploads/posts/coffee.jpg', 'photo', 47.6062, -122.3321, 'USA', 'WA', 'Seattle', CURDATE(), 'public', TRUE),
(1, NULL, 'Working from this amazing coffee shop today. The vibes are immaculate! ☕', '/uploads/posts/cafe.jpg', 'photo', 40.7128, -74.0060, 'USA', 'NY', 'New York', CURDATE(), 'public', TRUE),
(2, 2, 'Brunch recommendation: Try the avocado toast at Green Kitchen. Life changing! 🥑', NULL, 'none', 34.0522, -118.2437, 'USA', 'CA', 'Los Angeles', CURDATE(), 'public', TRUE),
(3, 4, 'Night photography can be challenging but so rewarding. ISO 3200, f/2.8, 30s exposure. What settings do you use?', '/uploads/posts/night.jpg', 'photo', 51.5074, -0.1278, 'UK', 'England', 'London', CURDATE(), 'public', TRUE),
(4, 3, 'Morning yoga session by the beach. Best way to start the day! 🧘‍♀️', NULL, 'none', 34.0522, -118.2437, 'USA', 'CA', 'Los Angeles', CURDATE(), 'public', TRUE),
(5, NULL, 'Tokyo street photography dump. This city never ceases to amaze me 📸', '/uploads/posts/tokyo.jpg', 'photo', 35.6762, 139.6503, 'Japan', 'Tokyo', 'Tokyo', CURDATE(), 'public', TRUE);

-- Insert comments
INSERT INTO comments (post_id, user_id, content, is_active) VALUES
(1, 2, 'This looks great! What database are you using?', TRUE),
(1, 3, 'Impressive work! How long did it take you to build?', TRUE),
(1, 5, 'Love the UI! Is it open source?', TRUE),
(2, 1, 'Absolutely! The server components are amazing', TRUE),
(2, 5, 'Can''t wait to try it in production', TRUE),
(3, 5, 'Stunning shot! What camera did you use?', TRUE),
(3, 1, 'The colors are incredible! 😍', TRUE),
(4, 8, 'Congrats on the PR! Keep it up!', TRUE),
(4, 3, 'That''s amazing! What''s your training routine?', TRUE),
(5, 3, 'Great tip! I usually shoot an hour before sunset', TRUE),
(6, 2, 'Adding this to my list! Thanks for sharing', TRUE),
(6, 10, 'I''ve been there! Their tiramisu is also incredible', TRUE),
(7, 1, 'Can''t wait to hear it! Drop the link when it''s out', TRUE),
(8, 9, 'Solid advice! Customer feedback is everything', TRUE),
(9, 8, 'Congratulations! Well deserved! 🎊', TRUE),
(10, 6, 'French press all the way! Richer flavor', TRUE),
(10, 1, 'Pour-over for me. Love the clarity of flavor', TRUE);

-- Insert hashtags
INSERT INTO hashtags (name, usage_count) VALUES
('photography', 5), ('sunset', 2), ('tech', 8), ('startup', 4), 
('fitness', 3), ('food', 4), ('coffee', 3), ('react', 2),
('travel', 2), ('music', 1);

-- Insert post hashtags
INSERT INTO post_hashtags (post_id, hashtag_id) VALUES
(3, 1), (3, 2), (5, 1), (13, 1), (15, 1),
(1, 3), (2, 3), (2, 8), (8, 3), (9, 4),
(4, 5), (14, 5), (6, 6), (12, 6), (10, 7),
(7, 10), (15, 9);

-- Insert post reactions
INSERT INTO post_reactions (post_id, user_id, reaction_type) VALUES
(1, 2, 'like'), (1, 3, 'love'), (1, 5, 'celebrate'),
(2, 1, 'like'), (2, 3, 'like'), (2, 5, 'wow'),
(3, 1, 'love'), (3, 5, 'celebrate'), (3, 4, 'love'),
(4, 2, 'celebrate'), (4, 8, 'wow'), (4, 1, 'like'),
(5, 1, 'celebrate'), (5, 3, 'love'), (5, 4, 'celebrate'),
(6, 1, 'love'), (6, 2, 'love'), (6, 10, 'love'),
(7, 1, 'celebrate'), (7, 3, 'love'),
(8, 1, 'like'), (8, 9, 'celebrate'),
(9, 1, 'celebrate'), (9, 8, 'celebrate'), (9, 2, 'celebrate'),
(10, 1, 'love'), (10, 6, 'love'), (10, 7, 'love');

-- Insert comment reactions
INSERT INTO comment_reactions (comment_id, user_id, reaction_type) VALUES
(1, 1, 'like'), (2, 1, 'like'), (3, 1, 'love'),
(4, 2, 'like'), (6, 1, 'like'), (8, 4, 'like'),
(11, 6, 'like'), (15, 9, 'love');

-- Insert notifications
INSERT INTO notifications (user_id, actor_id, type, notification_type, message, content, post_id, is_read, data) VALUES
(1, 2, 'like', 'like', 'Jane Smith liked your post', 'Jane Smith liked your post about deploying your app', 1, FALSE, '{"post_content": "Just deployed my first full-stack app!"}'),
(1, 3, 'comment', 'comment', 'Mike Johnson commented on your post', 'Mike Johnson: Impressive work! How long did it take you to build?', 1, FALSE, '{"post_content": "Just deployed my first full-stack app!"}'),
(2, 1, 'comment', 'follow', 'John Doe started following you', 'John Doe is now following you', NULL, TRUE, '{}'),
(3, 5, 'like', 'like', 'Alex Brown liked your post', 'Alex Brown liked your sunset photo', 3, FALSE, '{"post_content": "Beautiful sunset at the beach"}'),
(5, 3, 'comment', 'comment', 'Mike Johnson commented on your post', 'Mike Johnson: Great tip! I usually shoot an hour before sunset', 5, FALSE, '{"post_content": "Golden hour photography tips"}'),
(6, 10, 'comment', 'comment', 'Rachel Taylor commented on your post', 'Rachel Taylor: I''ve been there! Their tiramisu is also incredible', 6, TRUE, '{"post_content": "Found this amazing Italian restaurant"}');

SELECT '✅ Sample data inserted successfully!' AS status;
SELECT CONCAT('Users: ', COUNT(*), ' records') AS summary FROM users
UNION ALL
SELECT CONCAT('Departments: ', COUNT(*), ' records') FROM departments
UNION ALL
SELECT CONCAT('Posts: ', COUNT(*), ' records') FROM posts
UNION ALL
SELECT CONCAT('Comments: ', COUNT(*), ' records') FROM comments
UNION ALL
SELECT CONCAT('Reactions: ', COUNT(*), ' records') FROM post_reactions
UNION ALL
SELECT CONCAT('Follows: ', COUNT(*), ' records') FROM follows;
