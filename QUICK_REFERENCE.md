# Quick Reference - Production Features

## 🚫 Business Rules Enforced

### What Users CANNOT Do:
- ❌ Like their own posts → Button disabled (frontend) + 400 error (backend)
- ❌ Share their own posts → Button disabled (frontend) + 400 error (backend)
- ❌ Join departments they created → 400 error (backend) - Already admin
- ❌ Post in departments they're not members of → 403 error (backend)
- ❌ See department posts if not a member → Filtered out (backend)
- ❌ Edit/delete posts they don't own → 403 error (backend)
- ❌ Edit/delete comments they don't own → 403 error (backend)

### What Users CAN Do:
- ✅ Like and share others' posts
- ✅ Comment on any post (including their own)
- ✅ Join any department (except their own)
- ✅ Create unlimited posts (public or in departments they're members of)
- ✅ View user profiles
- ✅ See all public posts
- ✅ See department posts where they're members
- ✅ Leave departments they joined (not creator's)

---

## 🎯 Department System

### Roles & Permissions:
- **Admin** (Creator): Auto-assigned, can't leave, can delete department
- **Moderator**: Can manage members, moderate posts
- **Member**: Can post and view department content

### Department Flow:
1. User creates department → Becomes admin automatically
2. Other users join → Become members
3. Only members see department posts
4. Only members can post in department
5. Creator cannot join (already admin)

---

## 👤 User Profile System

### Available at: `/profile/[username]`

### Shows:
- User information (name, username, bio, location)
- Statistics:
  - Total posts
  - Total likes received
  - Departments count
  - Comments count
- User's departments (with role badges)
- User's posts (respects access control)
- User activity (likes, comments, shares)

### Access Control:
- Public profiles (anyone can view)
- Posts filtered by viewer's access rights
- Non-members can't see private department posts

---

## 📝 Post Visibility Matrix

| Post Type | Who Can See |
|-----------|-------------|
| Public Post (no department) | Everyone (including non-authenticated) |
| Department Post | Department members + Creator only |
| User's Own Posts | Always visible to user |

---

## 🔗 Navigation Flow

```
Home Page
  ├─ Click username → User Profile
  ├─ Click post → Post Details Modal
  ├─ Click department badge → Department Page (future)
  └─ Post Upload → Select department (if member)

User Profile
  ├─ View Stats
  ├─ Click department → Department Page (future)
  └─ View Posts/Activity

Departments Page
  ├─ Create Department → Auto-admin
  ├─ Join Department → Become member
  └─ View Members
```

---

## ⚡ Quick Testing Guide

### Test Business Rules:
```bash
# 1. Start backend
cd backend
npm run dev

# 2. Start frontend (new terminal)
cd ..
npm run dev

# 3. Test Flow:
→ Register user
→ Create department (you're auto-admin)
→ Create post in that department
→ Try to like your own post → Button disabled ✓
→ Create second user
→ Try to join first user's department as second user → Success ✓
→ Try to post in department without joining → Error ✓
→ Join department → Success ✓
→ Post in department → Success ✓
→ Click first user's name → View profile ✓
```

---

## 🔍 API Endpoints Quick Ref

### Profile (NEW)
- `GET /api/profile/:username` - User profile
- `GET /api/profile/:username/posts` - User posts
- `GET /api/profile/:username/activity` - User activity

### Posts (Modified)
- `POST /api/posts` - Create (checks department membership)
- `GET /api/posts` - List (filters by access)
- `POST /api/posts/:id/like` - Toggle like (prevents self-like)
- `POST /api/posts/:id/share` - Toggle share (prevents self-share)

### Departments (Modified)
- `POST /api/departments` - Create (auto-admin)
- `POST /api/departments/:id/join` - Join (prevents self-join)

---

## 📊 Database Views

### post_statistics
Aggregates likes, comments, shares per post (auto-updated)

### department_statistics  
Aggregates members, posts per department (auto-updated)

---

## 🎨 Frontend Components

### Modified:
- `post-feed.tsx` - Disabled like/share on own posts, clickable usernames
- `lib/api.ts` - Added profileApi

### New:
- `app/profile/[username]/page.tsx` - User profile page

---

## 📚 Documentation Files

- **[PRODUCTION_FLOW.md](PRODUCTION_FLOW.md)** - Complete application flow (650+ lines)
- **[PRODUCTION_UPGRADE.md](PRODUCTION_UPGRADE.md)** - Transformation summary
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - This guide

---

## 🐛 Common Issues

### "Cannot like your own post"
**Expected:** This is correct behavior. Like button is disabled.

### "Must be member to post"
**Expected:** You need to join the department first.

### "You are the creator of this department"
**Expected:** Creators are auto-members (admin), can't join again.

### "Post not found" when viewing profile
**Expected:** You don't have access to see that post (private department).

---

## 🎯 Key Features

✅ Self-action prevention
✅ Department membership system
✅ Access control
✅ User profiles
✅ Activity tracking
✅ Proper validation
✅ Visual feedback
✅ Comprehensive documentation

**PeekHour is production-ready!**
