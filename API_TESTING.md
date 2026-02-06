# API Testing Guide

This guide provides examples for testing PeekHour API endpoints using cURL, Postman, or any HTTP client.

## Base URL
```
http://localhost:5000/api
```

## Authentication

Most endpoints require a JWT token. After login/register, include the token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Authentication Endpoints

### Register New User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -F "name=John Doe" \
  -F "username=johndoe" \
  -F "email=john@example.com" \
  -F "mobileNumber=9876543210" \
  -F "password=password123" \
  -F "faceImage=@/path/to/face.jpg"
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "username": "johndoe",
      "email": "john@example.com",
      "avatar": "JD"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "username": "johndoe",
      "email": "john@example.com",
      "avatar": "JD"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get Profile (Protected)
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 2. Post Endpoints

### Create Post (Protected)
```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "content=Amazing sunset at Marina Beach!" \
  -F "mediaType=photo" \
  -F "media=@/path/to/image.jpg" \
  -F "country=India" \
  -F "state=Tamil Nadu" \
  -F "city=Chennai" \
  -F "area=Marina" \
  -F "postDate=2026-01-19"
```

**Response:**
```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "postId": 1
  }
}
```

### Get All Posts
```bash
# Without filters
curl -X GET http://localhost:5000/api/posts

# With filters
curl -X GET "http://localhost:5000/api/posts?city=Chennai&page=1&limit=10"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": 1,
        "author_name": "John Doe",
        "author_username": "johndoe",
        "content": "Amazing sunset!",
        "media_url": "/uploads/media/abc123.jpg",
        "likes_count": 42,
        "comments_count": 5,
        ...
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

### Like/Unlike Post (Protected)
```bash
curl -X POST http://localhost:5000/api/posts/1/like \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Post liked",
  "data": {
    "liked": true
  }
}
```

---

## 3. Department Endpoints

### Create Department (Protected)
```bash
curl -X POST http://localhost:5000/api/departments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Computer Science Department",
    "type": "college",
    "description": "CS department community",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "country": "India"
  }'
```

### Get All Departments
```bash
# All departments
curl -X GET http://localhost:5000/api/departments

# Filter by type
curl -X GET "http://localhost:5000/api/departments?type=college"

# Search
curl -X GET "http://localhost:5000/api/departments?search=computer"
```

### Join Department (Protected)
```bash
curl -X POST http://localhost:5000/api/departments/1/join \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 4. Comment Endpoints

### Add Comment (Protected)
```bash
curl -X POST http://localhost:5000/api/posts/1/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Great photo!",
    "isBold": false,
    "isItalic": true
  }'
```

### Get Comments
```bash
curl -X GET "http://localhost:5000/api/posts/1/comments?page=1&limit=20"
```

---

## 5. User Endpoints

### Get User Locations (Protected)
```bash
curl -X GET http://localhost:5000/api/user/locations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Notifications (Protected)
```bash
# All notifications
curl -X GET http://localhost:5000/api/user/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"

# Unread only
curl -X GET "http://localhost:5000/api/user/notifications?unreadOnly=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get User Feed (Protected)
```bash
curl -X GET "http://localhost:5000/api/user/feed?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Advanced Filtering

### Search Posts by Multiple Criteria
```bash
curl -X GET "http://localhost:5000/api/posts?\
country=India&\
state=Tamil Nadu&\
city=Chennai&\
area=Mylapore&\
startDate=2026-01-01&\
endDate=2026-01-31&\
page=1&\
limit=20"
```

### Search by Department
```bash
curl -X GET "http://localhost:5000/api/posts?departmentId=1"
```

### Search by Username
```bash
curl -X GET "http://localhost:5000/api/posts?username=johndoe"
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Post not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Postman Collection

You can import these endpoints into Postman:

1. Create new collection "PeekHour API"
2. Add environment variable `base_url` = `http://localhost:5000/api`
3. Add environment variable `token` = `<your_jwt_token>`
4. Use `{{base_url}}` and `{{token}}` in requests

---

## Testing Workflow

1. **Register** a new user → Save token
2. **Login** with credentials → Verify token
3. **Create Department** → Save department ID
4. **Create Post** with media → Save post ID
5. **Like Post** → Verify like count increases
6. **Add Comment** → Verify comment appears
7. **Get Feed** → Verify posts appear

---

## Health Check

```bash
curl -X GET http://localhost:5000/api/health
```

**Response:**
```json
{
  "success": true,
  "message": "PeekHour API is running",
  "timestamp": "2026-01-19T10:30:00.000Z"
}
```
