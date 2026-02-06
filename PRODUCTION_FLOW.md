# PeekHour - Production Grade Application Flow

## Overview
PeekHour is a location-based social media platform where users can share posts, join departments, and interact with content based on their location and community membership.

---

## 1. User Authentication Flow

### Registration (Sign Up)
**Endpoint:** `POST /api/auth/register`

**Process:**
1. User provides: name, username, email, mobile, password
2. **Optional:** Face capture (can be skipped for testing)
3. Backend validates:
   - Username uniqueness
   - Email uniqueness
   - Password strength (min 6 characters)
4. Password is hashed using bcrypt (10 salt rounds)
5. User record created in database
6. JWT token generated (7-day expiration)
7. Token stored in localStorage
8. User redirected to `/home`

**Business Rules:**
- Username must be unique
- Email must be unique
- Face capture is optional
- Default profile avatar assigned randomly

---

### Login
**Endpoint:** `POST /api/auth/login`

**Process:**
1. User provides: username, password
2. Backend validates credentials
3. Password verified with bcrypt
4. JWT token generated
5. Token stored in localStorage
6. AuthContext updated with user data
7. User redirected to `/home`

**Business Rules:**
- Invalid credentials return 401 error
- Token expires after 7 days
- Automatic logout on token expiration

---

### Authentication Middleware
**File:** `backend/middleware/auth.js`

**Types:**
- `authenticate`: Requires valid JWT token (protects all user actions)
- `optionalAuth`: Allows both authenticated and guest access (used for public content)

**Protected Routes:**
- All `/home`, `/search`, `/departments` pages
- All POST, PUT, DELETE operations
- Profile viewing (own profile only)

---

## 2. Department System

### Creating a Department
**Endpoint:** `POST /api/departments`

**Process:**
1. User provides: name, type, description, location
2. Department types: `college`, `government`, `corporate`, `community`
3. Department created in database
4. **Creator automatically added as ADMIN** (auto-join)
5. Returns department ID

**Business Rules:**
- Only authenticated users can create departments
- Creator becomes admin automatically
- Creator cannot join their own department (already a member)

---

### Joining a Department
**Endpoint:** `POST /api/departments/:id/join`

**Process:**
1. User requests to join department
2. Backend validates:
   - Department exists and is active
   - User is not the creator (prevents self-join)
   - User is not already a member
3. User added as `member` role
4. Membership timestamp recorded

**Business Rules:**
- **CRITICAL:** Cannot join own department (creator auto-joins as admin)
- Cannot join twice
- Only active departments can be joined
- Default role: `member`

---

### Department Membership Roles
**Roles:** `admin`, `moderator`, `member`

**Permissions:**
- **Admin:** Can edit department, manage members, delete department
- **Moderator:** Can moderate posts, manage members
- **Member:** Can view and post in department

---

## 3. Post System

### Creating a Post
**Endpoint:** `POST /api/posts`

**Process:**
1. User provides: content, media (optional), location, department (optional)
2. **Department Validation:**
   - If posting to department: Check user is member OR creator
   - If not a member: Return 403 Forbidden
3. Media upload handled by Multer (10MB limit)
4. Post date auto-generated (current date)
5. Location defaults to India if not provided
6. Post created with `is_active = TRUE`

**Business Rules:**
- **CRITICAL:** Must be department member to post in department
- Public posts (no department) visible to all
- Department posts only visible to members
- Media types: photo, video, audio, none
- Location optional (defaults to India)

---

### Viewing Posts
**Endpoint:** `GET /api/posts`

**Access Control (CRITICAL):**
```sql
-- For authenticated users
Show posts WHERE:
  - department_id IS NULL (public posts)
  - OR user is member of department
  - OR user created the department

-- For non-authenticated users  
Show posts WHERE:
  - department_id IS NULL (only public posts)
```

**Filtering:**
- By department ID
- By location (country, state, city, area, street, pinCode)
- By date range
- By username
- Pagination supported

**Business Rules:**
- **Private department posts hidden from non-members**
- Public posts visible to everyone
- Creator's department posts always visible to them
- Results include like/share status for authenticated users

---

### Liking a Post
**Endpoint:** `POST /api/posts/:id/like`

**Process:**
1. User attempts to like post
2. **Validation:**
   - Post exists and is active
   - **CRITICAL:** User is NOT the post author (prevents self-like)
3. Check if already liked
4. If liked: Remove like (toggle off)
5. If not liked: Add like (toggle on)
6. Return updated like status

**Business Rules:**
- **CRITICAL:** Cannot like own posts (returns 400 error)
- Toggle behavior (like/unlike)
- Like count updated via database view
- Frontend disables like button on own posts

---

### Sharing a Post
**Endpoint:** `POST /api/posts/:id/share`

**Process:**
1. User attempts to share post
2. **Validation:**
   - Post exists and is active
   - **CRITICAL:** User is NOT the post author (prevents self-share)
3. Check if already shared
4. If shared: Remove share (toggle off)
5. If not shared: Add share (toggle on)
6. Return updated share status

**Business Rules:**
- **CRITICAL:** Cannot share own posts (returns 400 error)
- Toggle behavior (share/unshare)
- Share count updated via database view
- Frontend disables share button on own posts

---

### Commenting on Posts
**Endpoint:** `POST /api/posts/:postId/comments`

**Process:**
1. User provides comment content
2. Optional formatting: bold, italic
3. Comment linked to post and user
4. Timestamp recorded
5. Comment count incremented

**Business Rules:**
- Can comment on own posts (allowed)
- Comment content required
- Formatting optional
- Comments can be edited/deleted by author

---

## 4. User Profile System

### Viewing User Profile
**Endpoint:** `GET /api/profile/:username`

**Returns:**
- User information (name, username, email, mobile, bio, location)
- Statistics:
  - Total posts count
  - Total likes received
  - Departments count
  - Comments count
- User's departments (top 5, with role)

**Business Rules:**
- Public profiles (anyone can view)
- Email and mobile visible only to profile owner (future enhancement)
- Statistics calculated in real-time

---

### User Posts
**Endpoint:** `GET /api/profile/:username/posts`

**Access Control:**
- Shows public posts + department posts viewer can access
- Same filtering logic as main feed
- Respects department membership

**Business Rules:**
- Non-members cannot see private department posts
- Member-only content filtered out for non-members

---

### User Activity
**Endpoint:** `GET /api/profile/:username/activity`

**Shows:**
- Recent likes
- Recent comments
- Recent shares
- Sorted by timestamp (newest first)

**Business Rules:**
- Activity shown for public posts only
- Privacy-respecting (doesn't expose private department activity)

---

## 5. Frontend Application Flow

### Landing Page (`/`)
**Behavior:**
- If user authenticated → Redirect to `/home`
- If user not authenticated → Show "Get Started" and "Login" buttons

---

### Home Page (`/home`)
**Protected Route:** Requires authentication

**Features:**
- Post upload card (create new posts)
- Post feed (shows posts user has access to)
- Like/Share/Comment interactions
- **Visual Cues:**
  - Like/Share buttons disabled on own posts (with tooltip)
  - Clickable usernames (navigate to profile)
  - Department badges (clickable)

---

### Departments Page (`/departments`)
**Protected Route:** Requires authentication

**Features:**
- List all departments
- Create new department button
- Join/Leave department actions
- View department members
- **Visual Cues:**
  - Cannot join own departments
  - Shows membership status
  - Admin badge for department creators

---

### Search Page (`/search`)
**Protected Route:** Requires authentication

**Features:**
- Filter by location
- Filter by department
- Filter by date range
- Filter by username
- Results respect access control

---

### User Profile Page (`/profile/[username]`)
**Access:** Public (with optional auth)

**Features:**
- User statistics
- User's departments
- User's posts (filtered by access)
- User activity timeline
- Edit button (only on own profile)

---

## 6. Database Schema & Relationships

### Key Tables
- `users`: User accounts
- `departments`: Community groups
- `department_members`: Membership with roles
- `posts`: Content posts
- `comments`: Post comments
- `post_likes`: Like tracking
- `post_shares`: Share tracking

### Critical Foreign Keys
- Posts → Users (ON DELETE CASCADE)
- Posts → Departments (ON DELETE SET NULL)
- Department Members → Users (ON DELETE CASCADE)
- Department Members → Departments (ON DELETE CASCADE)
- Likes → Posts (ON DELETE CASCADE)
- Shares → Posts (ON DELETE CASCADE)

### Database Views
- `post_statistics`: Aggregates likes/comments/shares per post
- `department_statistics`: Aggregates member/post counts per department

---

## 7. Business Logic Rules Summary

### Self-Action Prevention
✅ **Cannot like own posts** (backend validates, frontend disables)
✅ **Cannot share own posts** (backend validates, frontend disables)
✅ **Cannot join own departments** (creator auto-joins as admin)

### Access Control
✅ **Department posts only visible to members**
✅ **Must be member to post in department**
✅ **Public posts visible to everyone**
✅ **Non-authenticated users see only public posts**

### Ownership Validation
✅ **Can only edit/delete own posts**
✅ **Can only edit/delete own comments**
✅ **Department creator is admin**

### Data Integrity
✅ **Post date auto-generated** (prevents future dates)
✅ **Location defaults to India**
✅ **User avatar auto-assigned**
✅ **Department creator auto-joins as admin**

---

## 8. Testing Flow

### Complete User Journey

**1. Registration:**
```
→ Go to /signup
→ Fill form (skip face capture)
→ Submit → Redirected to /home
```

**2. Create Department:**
```
→ Go to /departments
→ Click "Create Department"
→ Fill form → Submit
→ You are now ADMIN (auto-joined)
```

**3. Create Post:**
```
→ Go to /home
→ Fill post form
→ Select department (optional)
→ If department selected: Must be member
→ Upload media (optional)
→ Submit
```

**4. Interact with Posts:**
```
→ View feed
→ Click username → View profile
→ Try to like own post → Button disabled
→ Like other's post → Success
→ Comment on any post → Success
→ Share other's post → Success
```

**5. Join Department:**
```
→ Go to /departments
→ Find department (not created by you)
→ Click "Join"
→ Now can post in that department
```

**6. View Profile:**
```
→ Click any username
→ View their stats, departments, posts
→ See only posts you have access to
```

---

## 9. Error Handling

### Common Error Responses

**400 Bad Request:**
- Cannot like own post
- Cannot share own post
- Cannot join own department
- Already a member

**401 Unauthorized:**
- No auth token
- Invalid token
- Expired token

**403 Forbidden:**
- Not a department member (trying to post)
- Not authorized to edit/delete

**404 Not Found:**
- User not found
- Post not found
- Department not found

**500 Internal Server Error:**
- Database errors
- Server errors

---

## 10. Production Considerations

### Security
✅ JWT authentication (7-day expiration)
✅ Password hashing (bcrypt, 10 rounds)
✅ Helmet security headers
✅ CORS configured
✅ Input validation (express-validator)
✅ SQL injection prevention (parameterized queries)

### Performance
✅ Database indexes on frequently queried fields
✅ Database views for aggregated data
✅ Pagination on all list endpoints
✅ Connection pooling (MySQL2)

### Data Integrity
✅ Foreign key constraints
✅ ON DELETE CASCADE for cleanup
✅ Transaction support (MySQL InnoDB)
✅ Unique constraints (username, email)

### Monitoring
✅ Morgan request logging
✅ Error logging (console.error)
✅ Centralized error handling

---

## 11. API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update current user profile
- `POST /api/auth/logout` - Logout user

### Posts
- `POST /api/posts` - Create post (auth, optional department membership check)
- `GET /api/posts` - Get posts (access-controlled)
- `GET /api/posts/:id` - Get single post
- `PUT /api/posts/:id` - Update post (ownership check)
- `DELETE /api/posts/:id` - Delete post (ownership check)
- `POST /api/posts/:id/like` - Toggle like (prevents self-like)
- `POST /api/posts/:id/share` - Toggle share (prevents self-share)

### Departments
- `POST /api/departments` - Create department (auto-join as admin)
- `GET /api/departments` - Get all departments
- `GET /api/departments/:id` - Get single department
- `POST /api/departments/:id/join` - Join department (prevents self-join)
- `POST /api/departments/:id/leave` - Leave department
- `GET /api/departments/:id/members` - Get members
- `PUT /api/departments/:id` - Update department (admin only)
- `DELETE /api/departments/:id` - Delete department (admin only)

### Comments
- `POST /api/posts/:postId/comments` - Add comment
- `GET /api/posts/:postId/comments` - Get comments
- `PUT /api/comments/:id` - Update comment (ownership check)
- `DELETE /api/comments/:id` - Delete comment (ownership check)

### User
- `GET /api/user/locations` - Get user's posted locations
- `GET /api/user/notifications` - Get notifications
- `PUT /api/user/notifications/:id/read` - Mark notification read
- `PUT /api/user/notifications/read-all` - Mark all read
- `GET /api/user/feed` - Get personalized feed

### Profile
- `GET /api/profile/:username` - Get user profile (public)
- `GET /api/profile/:username/posts` - Get user posts (access-controlled)
- `GET /api/profile/:username/activity` - Get user activity

---

## 12. Frontend Routes

### Public Routes
- `/` - Landing page (redirects if authenticated)
- `/login` - Login page
- `/signup` - Registration page

### Protected Routes (Require Authentication)
- `/home` - Main feed
- `/search` - Search posts
- `/departments` - Browse/manage departments
- `/profile/[username]` - User profile (public but enhanced when authenticated)

---

## Conclusion

This production-grade setup ensures:
- **Business logic integrity** (no self-likes, proper access control)
- **Data security** (authentication, authorization, validation)
- **User experience** (intuitive flows, visual feedback)
- **Scalability** (indexed database, paginated queries)
- **Maintainability** (modular code, clear separation of concerns)

All features are properly connected with validation rules enforced both on frontend and backend levels.
