import db from '../config/database.js';

// Get user profile by username
export const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;

    // Get user info
    const [users] = await db.query(
      `SELECT id, name, username, email, mobile, bio, location, 
              profile_avatar, created_at
       FROM users 
       WHERE username = ?`,
      [username]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    // Get user statistics
    const [stats] = await db.query(
      `SELECT 
        (SELECT COUNT(*) FROM posts WHERE user_id = ? AND is_active = TRUE) as posts_count,
        (SELECT COUNT(*) FROM post_likes pl 
         INNER JOIN posts p ON pl.post_id = p.id 
         WHERE p.user_id = ? AND p.is_active = TRUE) as likes_received,
        (SELECT COUNT(*) FROM department_members WHERE user_id = ?) as departments_count,
        (SELECT COUNT(*) FROM comments WHERE user_id = ? AND is_active = TRUE) as comments_count`,
      [user.id, user.id, user.id, user.id]
    );

    // Get user's departments
    const [departments] = await db.query(
      `SELECT d.id, d.name, d.type, d.avatar, dm.role
       FROM department_members dm
       INNER JOIN departments d ON dm.department_id = d.id
       WHERE dm.user_id = ? AND d.is_active = TRUE
       ORDER BY dm.joined_at DESC
       LIMIT 5`,
      [user.id]
    );

    res.json({
      success: true,
      data: {
        user: {
          ...user,
          ...stats[0]
        },
        departments
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
};

// Get user's posts
export const getUserPosts = async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get user ID
    const [users] = await db.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userId = users[0].id;

    // Get posts (only public or department posts current user can see)
    let accessFilter = '';
    let accessParams = [userId];

    if (req.user) {
      accessFilter = `AND (
        p.department_id IS NULL 
        OR p.department_id IN (
          SELECT dm.department_id FROM department_members dm WHERE dm.user_id = ?
          UNION
          SELECT d.id FROM departments d WHERE d.created_by = ?
        )
      )`;
      accessParams.push(req.user.id, req.user.id);
    } else {
      accessFilter = 'AND p.department_id IS NULL';
    }

    const [posts] = await db.query(
      `SELECT 
        p.*,
        u.name as author_name,
        u.username as author_username,
        u.profile_avatar as author_avatar,
        d.name as department_name,
        ps.likes_count,
        ps.comments_count,
        ps.shares_count
       FROM posts p
       INNER JOIN users u ON p.user_id = u.id
       LEFT JOIN departments d ON p.department_id = d.id
       LEFT JOIN post_statistics ps ON p.id = ps.post_id
       WHERE p.user_id = ? AND p.is_active = TRUE ${accessFilter}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...accessParams, parseInt(limit), offset]
    );

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM posts p
       WHERE p.user_id = ? AND p.is_active = TRUE ${accessFilter}`,
      accessParams
    );

    const total = countResult[0].total;

    // Check if current user liked/shared posts
    if (req.user && posts.length > 0) {
      const postIds = posts.map(p => p.id);
      const [userLikes] = await db.query(
        `SELECT post_id FROM post_likes WHERE user_id = ? AND post_id IN (?)`,
        [req.user.id, postIds]
      );
      const [userShares] = await db.query(
        `SELECT post_id FROM post_shares WHERE user_id = ? AND post_id IN (?)`,
        [req.user.id, postIds]
      );

      const likedIds = new Set(userLikes.map(l => l.post_id));
      const sharedIds = new Set(userShares.map(s => s.post_id));

      posts.forEach(post => {
        post.isLikedByUser = likedIds.has(post.id);
        post.isSharedByUser = sharedIds.has(post.id);
      });
    }

    res.json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user posts',
      error: error.message
    });
  }
};

// Get user's activity (likes, comments, shares)
export const getUserActivity = async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get user ID
    const [users] = await db.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userId = users[0].id;

    // Get recent activity
    const [activity] = await db.query(
      `(SELECT 'like' as type, pl.created_at, p.id as post_id, p.content as post_content, 
               u.name as post_author, u.username as post_author_username
        FROM post_likes pl
        INNER JOIN posts p ON pl.post_id = p.id
        INNER JOIN users u ON p.user_id = u.id
        WHERE pl.user_id = ? AND p.is_active = TRUE)
       UNION
       (SELECT 'comment' as type, c.created_at, p.id as post_id, p.content as post_content,
               u.name as post_author, u.username as post_author_username
        FROM comments c
        INNER JOIN posts p ON c.post_id = p.id
        INNER JOIN users u ON p.user_id = u.id
        WHERE c.user_id = ? AND c.is_active = TRUE AND p.is_active = TRUE)
       UNION
       (SELECT 'share' as type, ps.created_at, p.id as post_id, p.content as post_content,
               u.name as post_author, u.username as post_author_username
        FROM post_shares ps
        INNER JOIN posts p ON ps.post_id = p.id
        INNER JOIN users u ON p.user_id = u.id
        WHERE ps.user_id = ? AND p.is_active = TRUE)
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, userId, userId, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: activity,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user activity',
      error: error.message
    });
  }
};
