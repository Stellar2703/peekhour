# Database Setup Guide

## Prerequisites
- MySQL 8.0 or higher
- Administrative access to MySQL

## Installation

### Windows
1. Download MySQL Installer from https://dev.mysql.com/downloads/installer/
2. Run installer and select "Developer Default"
3. Follow wizard to install MySQL Server
4. Set root password during installation
5. Complete installation

### macOS
```bash
brew install mysql
brew services start mysql
mysql_secure_installation
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo mysql_secure_installation
```

## Database Creation

### Method 1: Using MySQL Command Line

1. **Login to MySQL:**
```bash
mysql -u root -p
```

2. **Run the schema file:**
```sql
source E:/VSCode/Projects/peekhour/backend/database/schema.sql
```

3. **Verify installation:**
```sql
USE peekhour_db;
SHOW TABLES;
```

You should see:
- comments
- department_members
- departments
- notifications
- post_likes
- post_shares
- posts
- user_locations
- users

4. **Check views:**
```sql
SHOW FULL TABLES WHERE TABLE_TYPE = 'VIEW';
```

You should see:
- department_statistics
- post_statistics

### Method 2: Using MySQL Workbench

1. Open MySQL Workbench
2. Connect to your MySQL server
3. File → Open SQL Script
4. Select `backend/database/schema.sql`
5. Execute script (⚡ icon)
6. Refresh schemas to see `peekhour_db`

### Method 3: Command Line (without MySQL shell)

```bash
mysql -u root -p < backend/database/schema.sql
```

## Database Configuration

### Update Backend .env

Edit `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=peekhour_db
```

### Test Connection

Run backend server:
```bash
cd backend
npm run dev
```

You should see:
```
✅ MySQL Database connected successfully
```

## Database Schema Overview

### Core Tables

**users** - User accounts
- id, name, username, email, mobile_number
- password_hash, face_image_path
- profile_avatar, is_active
- Indexes: username, email

**posts** - User posts
- id, user_id, department_id
- content, media_type, media_url
- country, state, city, area, street, pin_code
- latitude, longitude, post_date
- Indexes: location, date, department, user

**departments** - Communities/Groups
- id, name, type (college/government/corporate/community)
- description, avatar, location
- created_by, is_active
- Indexes: type, location

**department_members** - Department membership
- id, department_id, user_id
- role (admin/moderator/member)
- Unique constraint: (department_id, user_id)

**comments** - Post comments
- id, post_id, user_id
- content, is_bold, is_italic
- is_active

**post_likes** - Like tracking
- id, post_id, user_id
- Unique constraint: (post_id, user_id)

**post_shares** - Share tracking
- id, post_id, user_id
- Unique constraint: (post_id, user_id)

**user_locations** - Saved locations
- id, user_id
- country, state, city, area, street, pin_code
- last_used_at

**notifications** - User notifications
- id, user_id, type, reference_id
- message, is_read

### Views

**post_statistics** - Aggregated post stats
- post_id, likes_count, comments_count, shares_count

**department_statistics** - Department stats
- department_id, members_count, posts_count

## Sample Data (Optional)

You can insert sample data for testing:

```sql
USE peekhour_db;

-- Sample user (password: password123)
INSERT INTO users (name, username, email, mobile_number, password_hash, profile_avatar) VALUES
('John Doe', 'johndoe', 'john@example.com', '9876543210', '$2a$10$rFJE6TKz9lY8v4R7M8L7Gu3hV/XqkZ4n.Qz1.xL7Hq6v3L7M8L7Gu', 'JD');

-- Sample department
INSERT INTO departments (name, type, description, city, state, country, created_by) VALUES
('Computer Science', 'college', 'CS Department Community', 'Chennai', 'Tamil Nadu', 'India', 1);

-- Sample post
INSERT INTO posts (user_id, department_id, content, media_type, country, state, city, post_date) VALUES
(1, 1, 'Welcome to PeekHour!', 'none', 'India', 'Tamil Nadu', 'Chennai', CURDATE());
```

## Troubleshooting

### Can't connect to MySQL
```bash
# Check if MySQL is running
# Windows
sc query MySQL80

# macOS
brew services list | grep mysql

# Linux
systemctl status mysql
```

### Access denied for user 'root'
- Verify password in .env matches MySQL root password
- Try resetting MySQL root password

### Database already exists
```sql
DROP DATABASE IF EXISTS peekhour_db;
```
Then run schema.sql again

### Character encoding issues
Ensure your MySQL server is configured for UTF-8:
```sql
SHOW VARIABLES LIKE 'character_set%';
```

Should show `utf8mb4` for most variables.

### Foreign key errors
- Ensure tables are created in correct order (schema.sql handles this)
- Check InnoDB engine is being used

## Backup and Restore

### Backup Database
```bash
mysqldump -u root -p peekhour_db > peekhour_backup.sql
```

### Restore Database
```bash
mysql -u root -p peekhour_db < peekhour_backup.sql
```

## Performance Optimization

### Add Indexes (if needed)
```sql
-- Already included in schema.sql
CREATE INDEX idx_posts_created ON posts(created_at);
CREATE INDEX idx_posts_location ON posts(country, state, city);
```

### Query Optimization
```sql
-- Use EXPLAIN to analyze queries
EXPLAIN SELECT * FROM posts WHERE city = 'Chennai';
```

## Security

### Create Dedicated Database User (Recommended for Production)
```sql
CREATE USER 'peekhour_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON peekhour_db.* TO 'peekhour_user'@'localhost';
FLUSH PRIVILEGES;
```

Update .env:
```env
DB_USER=peekhour_user
DB_PASSWORD=secure_password
```

## Next Steps

After database setup:
1. ✅ Verify connection in backend logs
2. Test API with Postman/cURL
3. Register a test user
4. Create sample posts
5. Test all features

---

For issues, check:
- MySQL error logs
- Backend console output
- main [README.md](README.md)
