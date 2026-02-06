# Development Tips & Best Practices

## 🛠️ Development Workflow

### Starting Development

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
Runs on: `http://localhost:5000`

#### Terminal 2 - Frontend
```bash
# From project root
pnpm dev
```
Runs on: `http://localhost:3000`

#### Terminal 3 - Database (Optional)
```bash
mysql -u root -p
USE peekhour_db;
```

### Hot Reload

- **Backend**: Uses `nodemon` - auto-restarts on file changes
- **Frontend**: Next.js Fast Refresh - auto-reloads on changes

## 🔍 Debugging

### Backend Debugging

1. **Check Server Logs**
   - All requests logged with Morgan
   - Errors logged to console
   - Check terminal running backend

2. **Test API Directly**
   ```bash
   # Health check
   curl http://localhost:5000/api/health
   
   # Test endpoint
   curl http://localhost:5000/api/posts
   ```

3. **Check Database**
   ```sql
   -- Check recent posts
   SELECT * FROM posts ORDER BY created_at DESC LIMIT 5;
   
   -- Check user count
   SELECT COUNT(*) FROM users;
   
   -- Check statistics
   SELECT * FROM post_statistics;
   ```

4. **Add Debug Logs**
   ```javascript
   console.log('Debug:', variable);
   console.error('Error:', error);
   ```

### Frontend Debugging

1. **Browser DevTools**
   - F12 to open
   - Console tab for errors
   - Network tab for API calls
   - React DevTools for components

2. **Check API Calls**
   - Network tab → Filter by Fetch/XHR
   - Check request headers (Authorization token)
   - Check response status and data

3. **Add Debug Logs**
   ```typescript
   console.log('State:', state);
   console.error('API Error:', error);
   ```

## 📊 Database Tips

### Useful Queries

```sql
-- View all users
SELECT id, name, username, email FROM users;

-- View recent posts with author
SELECT p.id, u.username, p.content, p.created_at 
FROM posts p 
JOIN users u ON p.user_id = u.id 
ORDER BY p.created_at DESC 
LIMIT 10;

-- View department members
SELECT d.name, u.username, dm.role 
FROM department_members dm
JOIN departments d ON dm.department_id = d.id
JOIN users u ON dm.user_id = u.id;

-- View post with stats
SELECT p.*, ps.likes_count, ps.comments_count 
FROM posts p
LEFT JOIN post_statistics ps ON p.id = ps.post_id;

-- Find posts by location
SELECT * FROM posts WHERE city = 'Chennai' AND state = 'Tamil Nadu';

-- Clear all data (for testing)
TRUNCATE TABLE comments;
TRUNCATE TABLE post_likes;
TRUNCATE TABLE post_shares;
TRUNCATE TABLE department_members;
TRUNCATE TABLE posts;
TRUNCATE TABLE departments;
TRUNCATE TABLE user_locations;
TRUNCATE TABLE notifications;
TRUNCATE TABLE users;
```

### Reset Auto Increment
```sql
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE posts AUTO_INCREMENT = 1;
```

## 🔧 Common Development Tasks

### Add New API Endpoint

1. **Create Controller Function** (`backend/controllers/`)
   ```javascript
   export const newFunction = async (req, res) => {
     try {
       // Your logic
       res.json({ success: true, data: result });
     } catch (error) {
       res.status(500).json({ success: false, message: error.message });
     }
   };
   ```

2. **Add Route** (`backend/routes/`)
   ```javascript
   router.get('/new-endpoint', authenticate, newFunction);
   ```

3. **Add to API Service** (`lib/api.ts`)
   ```typescript
   export const newApi = {
     newMethod: async () => {
       return apiCall('/new-endpoint', { method: 'GET' });
     }
   };
   ```

4. **Use in Component**
   ```typescript
   const response = await newApi.newMethod();
   ```

### Add New Database Table

1. **Update schema.sql**
   ```sql
   CREATE TABLE new_table (
     id INT PRIMARY KEY AUTO_INCREMENT,
     name VARCHAR(255) NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   ) ENGINE=InnoDB;
   ```

2. **Run migration**
   ```bash
   mysql -u root -p peekhour_db < backend/database/schema.sql
   ```

3. **Add queries in controller**
   ```javascript
   const [rows] = await db.query('SELECT * FROM new_table');
   ```

### Add New Frontend Page

1. **Create page** (`app/newpage/page.tsx`)
   ```typescript
   export default function NewPage() {
     return <div>New Page</div>;
   }
   ```

2. **Add to navbar** (`components/navbar.tsx`)
   ```typescript
   <NavLink href="/newpage" ... />
   ```

## 🎨 Styling Tips

### Tailwind CSS Classes

```typescript
// Common patterns
className="flex items-center justify-between"
className="grid grid-cols-3 gap-4"
className="text-sm text-muted-foreground"
className="hover:bg-muted transition-colors"
className="rounded-lg border border-border p-4"
```

### Responsive Design
```typescript
className="hidden md:flex"  // Hide on mobile
className="flex-col sm:flex-row"  // Stack on mobile
className="text-sm lg:text-base"  // Smaller text on mobile
```

## 🔐 Security Best Practices

### Never Commit
- `.env` files
- Database credentials
- JWT secrets
- API keys

### Always Do
- Validate user input
- Sanitize database queries (use parameterized queries)
- Hash passwords before storing
- Use HTTPS in production
- Set proper CORS origins
- Implement rate limiting
- Add request size limits

## 📦 Package Management

### Add New Backend Package
```bash
cd backend
npm install package-name
```

### Add New Frontend Package
```bash
# From project root
pnpm add package-name
# or
npm install package-name
```

### Update Packages
```bash
# Backend
cd backend
npm update

# Frontend
pnpm update
```

## 🐛 Troubleshooting Guide

### Backend Won't Start
1. Check MySQL is running
2. Verify .env file exists and is configured
3. Check port 5000 is not in use
4. Run `npm install` again
5. Check for syntax errors in code

### Frontend Won't Start
1. Check .env.local exists
2. Delete `.next` folder and restart
3. Run `pnpm install` again
4. Check port 3000 is not in use
5. Clear browser cache

### API Calls Failing
1. Check backend is running
2. Verify token is valid (check localStorage)
3. Check CORS settings
4. Check API_URL in .env.local
5. Check Network tab in browser

### Database Errors
1. Check MySQL service status
2. Verify credentials in .env
3. Check table exists
4. Check foreign key constraints
5. Look at MySQL error logs

### File Upload Fails
1. Check uploads directory exists
2. Verify file size (< 10MB)
3. Check file type is allowed
4. Verify permissions on uploads folder

## 🚀 Performance Optimization

### Backend
- Use database indexes
- Implement caching (Redis)
- Optimize SQL queries (use EXPLAIN)
- Add pagination to all lists
- Compress responses (gzip)
- Use connection pooling

### Frontend
- Lazy load components
- Optimize images (Next.js Image)
- Implement virtual scrolling for long lists
- Use React.memo for expensive components
- Debounce search inputs
- Prefetch data

## 📈 Monitoring

### Key Metrics to Watch
- API response times
- Database query times
- Error rates
- Upload success rates
- User registration success rate

### Logging
```javascript
// Backend - Add contextual logging
console.log('[AUTH]', 'User login:', username);
console.log('[POST]', 'Creating post:', postId);
console.error('[ERROR]', 'Failed to upload:', error);
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] Register new user
- [ ] Login with user
- [ ] Create post without media
- [ ] Create post with photo
- [ ] Create post with video
- [ ] Like/unlike post
- [ ] Add comment
- [ ] Create department
- [ ] Join department
- [ ] Search posts

### API Testing with cURL
```bash
# Save token to variable
TOKEN="your_jwt_token"

# Test protected endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/auth/profile
```

## 💡 Tips & Tricks

### Quick Database Reset
```sql
-- Backup first!
mysqldump -u root -p peekhour_db > backup.sql

-- Then reset
source backend/database/schema.sql
```

### View Token Payload
```javascript
// In browser console
const token = localStorage.getItem('authToken');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);
```

### Clear All Local Data
```javascript
// In browser console
localStorage.clear();
location.reload();
```

### Pretty Print API Response
```bash
curl http://localhost:5000/api/posts | json_pp
```

## 📚 Learning Resources

### Backend
- Express.js: https://expressjs.com/
- MySQL: https://dev.mysql.com/doc/
- JWT: https://jwt.io/
- Multer: https://github.com/expressjs/multer

### Frontend
- Next.js: https://nextjs.org/docs
- React: https://react.dev/
- Tailwind CSS: https://tailwindcss.com/docs
- Radix UI: https://www.radix-ui.com/

## 🎯 Next Features to Implement

Priority order:
1. User profile page
2. Edit post functionality
3. Department admin panel
4. Email notifications
5. Real-time chat
6. Advanced analytics
7. Mobile app

---

**Happy Coding! 🚀**
