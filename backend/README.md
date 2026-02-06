# PeekHour Backend API

Complete backend API for PeekHour location-based social media platform.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
```bash
# Login to MySQL
mysql -u root -p

# Run schema
source database/schema.sql
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings
```

### 4. Start Server
```bash
# Development
npm run dev

# Production
npm start
```

## Environment Variables

Required variables in `.env`:
- `PORT` - Server port (default: 5000)
- `DB_HOST` - MySQL host
- `DB_PORT` - MySQL port
- `DB_USER` - MySQL username
- `DB_PASSWORD` - MySQL password
- `DB_NAME` - Database name
- `JWT_SECRET` - Secret for JWT tokens
- `JWT_EXPIRE` - Token expiration
- `FRONTEND_URL` - Frontend URL for CORS

## API Documentation

See main README.md for complete API endpoint documentation.

## File Structure

- `config/` - Database configuration
- `controllers/` - Business logic
- `middleware/` - Authentication, validation, upload
- `routes/` - API routes
- `database/` - Schema and migrations
- `uploads/` - User uploaded files

## Security

- JWT authentication
- bcrypt password hashing
- Input validation
- SQL injection protection
- File upload restrictions
- CORS configuration

## Database

MySQL 8.0+ with the following main tables:
- users
- posts
- departments
- comments
- post_likes
- post_shares

See `database/schema.sql` for complete schema.
