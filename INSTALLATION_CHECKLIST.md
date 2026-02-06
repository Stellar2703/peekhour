# Installation Checklist

Use this checklist to ensure everything is properly set up.

## ☑️ Pre-Installation

- [ ] Node.js 18+ installed
  ```bash
  node --version
  ```

- [ ] MySQL 8.0+ installed
  ```bash
  mysql --version
  ```

- [ ] pnpm or npm installed
  ```bash
  pnpm --version
  # or
  npm --version
  ```

- [ ] Git installed (optional)
  ```bash
  git --version
  ```

## ☑️ Database Setup

- [ ] MySQL server is running
  ```bash
  # Windows: sc query MySQL80
  # macOS: brew services list
  # Linux: systemctl status mysql
  ```

- [ ] Database schema created
  ```bash
  mysql -u root -p < backend/database/schema.sql
  ```

- [ ] Verify tables exist
  ```sql
  USE peekhour_db;
  SHOW TABLES;
  -- Should show 9 tables
  ```

- [ ] Verify views exist
  ```sql
  SHOW FULL TABLES WHERE TABLE_TYPE = 'VIEW';
  -- Should show 2 views
  ```

## ☑️ Backend Setup

- [ ] Navigate to backend directory
  ```bash
  cd backend
  ```

- [ ] Dependencies installed
  ```bash
  npm install
  ```

- [ ] .env file created
  ```bash
  cp .env.example .env
  ```

- [ ] .env configured with MySQL credentials
  - [ ] DB_HOST set
  - [ ] DB_PORT set (default: 3306)
  - [ ] DB_USER set (default: root)
  - [ ] DB_PASSWORD set (YOUR PASSWORD)
  - [ ] DB_NAME set (default: peekhour_db)
  - [ ] JWT_SECRET set (random string)

- [ ] Upload directories created
  ```bash
  mkdir -p uploads/media uploads/faces
  ```

- [ ] Backend server starts successfully
  ```bash
  npm run dev
  ```

- [ ] Database connection successful
  ```
  ✅ MySQL Database connected successfully
  ```

- [ ] API health check works
  ```bash
  curl http://localhost:5000/api/health
  # Should return success: true
  ```

## ☑️ Frontend Setup

- [ ] Navigate to project root
  ```bash
  cd ..
  ```

- [ ] Dependencies installed
  ```bash
  pnpm install
  # or
  npm install
  ```

- [ ] .env.local file created
  ```bash
  cp .env.local.example .env.local
  ```

- [ ] .env.local configured
  - [ ] NEXT_PUBLIC_API_URL set (default: http://localhost:5000/api)

- [ ] Frontend starts successfully
  ```bash
  pnpm dev
  # or
  npm run dev
  ```

- [ ] Can access frontend
  - [ ] http://localhost:3000 loads
  - [ ] Landing page displays correctly

## ☑️ Functionality Testing

### User Registration
- [ ] Navigate to /signup
- [ ] Can fill registration form
- [ ] Can capture face photo
- [ ] Registration succeeds
- [ ] Receives JWT token
- [ ] Redirected to /home

### User Login
- [ ] Navigate to /login
- [ ] Can enter credentials
- [ ] Login succeeds
- [ ] Receives JWT token
- [ ] Redirected to /home

### Create Post
- [ ] On /home, post upload card visible
- [ ] Can type text content
- [ ] Can select media type
- [ ] Can upload file
- [ ] Can select location
- [ ] Can choose department
- [ ] Post submission succeeds
- [ ] New post appears in feed

### View Posts
- [ ] Posts load on /home
- [ ] Post author displayed
- [ ] Post location displayed
- [ ] Post content displayed
- [ ] Media displays (if present)
- [ ] Like count displayed
- [ ] Comment count displayed

### Interact with Posts
- [ ] Can like/unlike posts
- [ ] Like count updates
- [ ] Can click to comment
- [ ] Comment modal opens
- [ ] Can add comment
- [ ] Comment appears
- [ ] Can share post
- [ ] Can download media

### Departments
- [ ] Navigate to /departments
- [ ] Departments list loads
- [ ] Can search departments
- [ ] Can filter by type
- [ ] Can create new department
- [ ] Can join department
- [ ] Can leave department

### Search
- [ ] Navigate to /search
- [ ] Search filters work
- [ ] Can search by location
- [ ] Can search by date
- [ ] Can search by department
- [ ] Results display correctly

## ☑️ API Testing (Optional)

Using cURL or Postman:

- [ ] POST /api/auth/register works
- [ ] POST /api/auth/login works
- [ ] GET /api/auth/profile works (with token)
- [ ] POST /api/posts works (with token)
- [ ] GET /api/posts works
- [ ] POST /api/posts/:id/like works (with token)
- [ ] POST /api/departments works (with token)
- [ ] GET /api/departments works
- [ ] POST /api/posts/:id/comments works (with token)
- [ ] GET /api/user/feed works (with token)

## ☑️ File Uploads

- [ ] backend/uploads directory exists
- [ ] backend/uploads/media directory exists
- [ ] backend/uploads/faces directory exists
- [ ] Directories have write permissions
- [ ] Face image saves during registration
- [ ] Media files save when creating posts
- [ ] Uploaded files accessible via URL

## ☑️ Security

- [ ] JWT_SECRET is a strong random string
- [ ] MySQL password is secure
- [ ] .env files are in .gitignore
- [ ] Protected routes require authentication
- [ ] Invalid tokens are rejected
- [ ] Passwords are hashed (not plain text)

## ☑️ Common Issues Resolved

- [ ] MySQL connection errors fixed
- [ ] Port conflicts resolved
- [ ] CORS errors resolved
- [ ] File upload errors fixed
- [ ] Environment variables set correctly
- [ ] No TypeScript errors in frontend
- [ ] No syntax errors in backend

## 🎉 Final Verification

- [ ] Backend running on http://localhost:5000
- [ ] Frontend running on http://localhost:3000
- [ ] Can register new user
- [ ] Can login
- [ ] Can create post
- [ ] Can see posts in feed
- [ ] Can interact with posts
- [ ] No console errors
- [ ] No network errors

## 📊 Performance Check

- [ ] Page loads quickly (<2s)
- [ ] Images load properly
- [ ] API responses fast (<500ms)
- [ ] No memory leaks
- [ ] Smooth user experience

## 📝 Documentation Read

- [ ] README.md reviewed
- [ ] QUICKSTART.md reviewed
- [ ] DATABASE_SETUP.md reviewed
- [ ] API_TESTING.md reviewed
- [ ] IMPLEMENTATION_SUMMARY.md reviewed

---

## ✅ Installation Complete!

If all items are checked, your PeekHour installation is complete and ready to use!

### What's Next?

1. **Customize**: Modify branding, colors, features
2. **Deploy**: Set up production environment
3. **Enhance**: Add new features from todo list
4. **Share**: Share your work with others

### Need Help?

- Check troubleshooting in README.md
- Review error logs (console + terminal)
- Verify all checkboxes above
- Test individual components

---

**Congratulations on completing the setup! 🎊**
