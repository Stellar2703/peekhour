# PeekHour - Location-Based Social Media Platform

PeekHour is a full-stack social media platform that allows users to discover and share events, photos, videos, and moments based on geographic locations. Users can create posts with media, join departments (communities), comment on posts, and interact with content through likes and shares.

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 16 (React 19)
- **UI Library**: Radix UI components with Tailwind CSS
- **State Management**: React hooks
- **API Communication**: Fetch API with custom service layer
- **Authentication**: JWT tokens stored in localStorage

### Backend
- **Framework**: Express.js (Node.js)
- **Database**: MySQL 8.0+
- **File Storage**: Local filesystem (uploads directory)
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, bcrypt for password hashing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **MySQL** (v8.0 or higher)
- **pnpm** (or npm/yarn)
- **Git**

## 🚀 Getting Started

### 1. Database Setup

#### Install MySQL
- **Windows**: Download from [MySQL Official Website](https://dev.mysql.com/downloads/installer/)
- **macOS**: `brew install mysql`
- **Linux**: `sudo apt-get install mysql-server`

#### Create Database and Tables

1. Start MySQL service:
   ```bash
   # Windows (as Administrator)
   net start MySQL80
   
   # macOS
   brew services start mysql
   
   # Linux
   sudo systemctl start mysql
   ```

2. Login to MySQL:
   ```bash
   mysql -u root -p
   ```

3. Run the schema file:
   ```sql
   source E:/VSCode/Projects/peekhour/backend/database/schema.sql
   ```

   Or manually execute:
   ```bash
   mysql -u root -p < backend/database/schema.sql
   ```

4. Verify database creation:
   ```sql
   USE peekhour_db;
   SHOW TABLES;
   ```

### 2. Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` file with your MySQL credentials:
   ```env
   PORT=5000
   NODE_ENV=development
   
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=peekhour_db
   
   JWT_SECRET=your_very_secure_random_secret_key_here
   JWT_EXPIRE=7d
   
   UPLOAD_DIR=uploads
   MAX_FILE_SIZE=10485760
   ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,video/mp4,video/webm,audio/mp3,audio/wav,audio/mpeg
   
   FRONTEND_URL=http://localhost:3000
   ```

5. Create uploads directories:
   ```bash
   mkdir -p uploads/media uploads/faces
   ```

6. Start the backend server:
   ```bash
   # Development mode (with auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

7. Verify backend is running:
   - Open browser to `http://localhost:5000`
   - You should see: `{"success": true, "message": "Welcome to PeekHour API"}`
   - Health check: `http://localhost:5000/api/health`

### 3. Frontend Setup

1. Navigate to frontend directory (project root):
   ```bash
   cd ..
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create environment file:
   ```bash
   cp .env.local.example .env.local
   ```

4. Edit `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

6. Open browser to `http://localhost:3000`

## 📁 Project Structure

```
peekhour/
├── backend/
│   ├── config/
│   │   └── database.js          # MySQL connection
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── postController.js    # Post CRUD operations
│   │   ├── departmentController.js
│   │   ├── commentController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── upload.js            # File upload (Multer)
│   │   ├── errorHandler.js
│   │   └── validator.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── postRoutes.js
│   │   ├── departmentRoutes.js
│   │   ├── commentRoutes.js
│   │   └── userRoutes.js
│   ├── database/
│   │   └── schema.sql           # Database schema
│   ├── uploads/                 # File storage
│   │   ├── media/
│   │   └── faces/
│   ├── .env                     # Environment variables
│   ├── server.js                # Express app entry
│   └── package.json
├── app/
│   ├── page.tsx                 # Landing page
│   ├── layout.tsx
│   ├── home/page.tsx            # Main feed
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── departments/page.tsx
│   └── search/page.tsx
├── components/
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── signup-form.tsx
│   ├── post-feed.tsx
│   ├── post-upload-card.tsx
│   ├── comment-section.tsx
│   ├── departments-list.tsx
│   └── navbar.tsx
├── lib/
│   └── api.ts                   # API service layer
└── package.json
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (with face capture)
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update profile (protected)
- `POST /api/auth/logout` - Logout (protected)

### Posts
- `POST /api/posts` - Create new post (protected)
- `GET /api/posts` - Get all posts (with filters)
- `GET /api/posts/:id` - Get single post
- `PUT /api/posts/:id` - Update post (protected)
- `DELETE /api/posts/:id` - Delete post (protected)
- `POST /api/posts/:id/like` - Toggle like (protected)
- `POST /api/posts/:id/share` - Toggle share (protected)

### Departments
- `POST /api/departments` - Create department (protected)
- `GET /api/departments` - Get all departments
- `GET /api/departments/:id` - Get single department
- `POST /api/departments/:id/join` - Join department (protected)
- `POST /api/departments/:id/leave` - Leave department (protected)
- `GET /api/departments/:id/members` - Get members
- `PUT /api/departments/:id` - Update department (admin)
- `DELETE /api/departments/:id` - Delete department (admin)

### Comments
- `POST /api/posts/:postId/comments` - Add comment (protected)
- `GET /api/posts/:postId/comments` - Get comments
- `PUT /api/comments/:id` - Update comment (protected)
- `DELETE /api/comments/:id` - Delete comment (protected)

### User
- `GET /api/user/locations` - Get saved locations (protected)
- `GET /api/user/notifications` - Get notifications (protected)
- `PUT /api/user/notifications/:id/read` - Mark as read (protected)
- `PUT /api/user/notifications/read-all` - Mark all as read (protected)
- `GET /api/user/feed` - Get personalized feed (protected)

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **CORS**: Configured for frontend origin
- **Helmet**: Security headers
- **Input Validation**: express-validator
- **SQL Injection Protection**: Parameterized queries
- **File Upload Limits**: Size and type restrictions
- **Face Recognition**: Photo capture during signup

## 📊 Database Schema

### Key Tables
- **users**: User accounts with authentication
- **posts**: User posts with location data
- **departments**: Community groups
- **department_members**: Department membership
- **comments**: Post comments
- **post_likes**: Like/thanks tracking
- **post_shares**: Share tracking
- **user_locations**: Saved locations
- **notifications**: User notifications

### Views
- **post_statistics**: Aggregated likes, comments, shares
- **department_statistics**: Member and post counts

## 🎨 Features

### User Features
- ✅ User registration with face capture
- ✅ Login/logout with JWT
- ✅ Profile management
- ✅ Create posts with photos/videos/audio
- ✅ Location-based posting
- ✅ Department/community creation and joining
- ✅ Like/unlike posts
- ✅ Comment on posts with formatting
- ✅ Share posts
- ✅ Download media
- ✅ Advanced search filters
- ✅ Personalized feed
- ✅ Notifications

### Admin Features
- ✅ Department management
- ✅ Member role management
- ✅ Content moderation (soft delete)

## 🧪 Testing the Application

### 1. Register a New User
1. Go to `http://localhost:3000/signup`
2. Fill in all fields
3. Capture your face photo
4. Submit the form

### 2. Login
1. Go to `http://localhost:3000/login`
2. Enter username and password
3. You'll be redirected to home feed

### 3. Create a Post
1. On home page, use the upload card
2. Add text content
3. Optionally upload media
4. Select location
5. Choose department (optional)
6. Click "Post to PeekHour"

### 4. Interact with Posts
- Click ⚡ to like/unlike
- Click 💬 to comment
- Click 📤 to share
- Click ⬇️ to download media

## 🛠️ Troubleshooting

### MySQL Connection Issues
```bash
# Check if MySQL is running
# Windows
sc query MySQL80

# Linux/macOS
systemctl status mysql
```

### Port Already in Use
```bash
# Backend (port 5000)
netstat -ano | findstr :5000  # Windows
lsof -i :5000                  # macOS/Linux

# Frontend (port 3000)
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # macOS/Linux
```

### File Upload Issues
- Check `uploads/` directory exists and has write permissions
- Verify `MAX_FILE_SIZE` in `.env`
- Check allowed MIME types

### CORS Errors
- Verify `FRONTEND_URL` in backend `.env`
- Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`

## 📝 Development Notes

### Adding New Features
1. Update database schema in `schema.sql`
2. Create controller in `backend/controllers/`
3. Add routes in `backend/routes/`
4. Create API functions in `lib/api.ts`
5. Update frontend components

### File Upload Guidelines
- Max size: 10MB
- Photos: JPEG, PNG, GIF
- Videos: MP4, WebM
- Audio: MP3, WAV, MPEG

## 🚀 Production Deployment

### Backend
1. Set `NODE_ENV=production` in `.env`
2. Use strong `JWT_SECRET`
3. Configure proper MySQL credentials
4. Set up reverse proxy (nginx)
5. Use PM2 for process management
6. Enable HTTPS

### Frontend
1. Build Next.js: `pnpm build`
2. Start production: `pnpm start`
3. Configure environment variables
4. Set up CDN for static assets

## 📄 License

This project is for educational purposes.

## 👥 Support

For issues and questions:
- Check the troubleshooting section
- Review API documentation
- Inspect browser console and server logs

---

**Happy Coding! 🎉**
