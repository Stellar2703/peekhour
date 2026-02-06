import db from '../config/database.js';

// Get user's saved locations
export const getUserLocations = async (req, res) => {
  try {
    const userId = req.user.id;

    const [locations] = await db.query(
      `SELECT * FROM user_locations 
       WHERE user_id = ? 
       ORDER BY last_used_at DESC 
       LIMIT 10`,
      [userId]
    );

    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    console.error('Get user locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user locations',
      error: error.message
    });
  }
};

// Get notifications
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'n.user_id = ?';
    if (unreadOnly === 'true') {
      whereClause += ' AND n.is_read = FALSE';
    }

    const [notifications] = await db.query(
      `SELECT n.*, u.name as from_user_name, u.username as from_user_username, u.profile_avatar as from_user_avatar
       FROM notifications n
       LEFT JOIN users u ON n.actor_id = u.id
       WHERE ${whereClause}
       ORDER BY n.created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), offset]
    );

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM notifications n WHERE ${whereClause}`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

// Mark notification as read
export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

// Mark all notifications as read
export const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

// Get user feed (posts from joined departments and own posts)
export const getUserFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get posts from departments user has joined or user's own posts
    const [posts] = await db.query(
      `SELECT DISTINCT
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
       LEFT JOIN department_members dm ON p.department_id = dm.department_id AND dm.user_id = ?
       WHERE p.is_active = TRUE 
       AND (dm.user_id IS NOT NULL OR p.user_id = ?)
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, userId, parseInt(limit), offset]
    );

    // Check if user liked/shared posts
    if (posts.length > 0) {
      const postIds = posts.map(p => p.id);
      const [userLikes] = await db.query(
        `SELECT post_id FROM post_likes WHERE user_id = ? AND post_id IN (?)`,
        [userId, postIds]
      );
      const [userShares] = await db.query(
        `SELECT post_id FROM post_shares WHERE user_id = ? AND post_id IN (?)`,
        [userId, postIds]
      );

      const likedPostIds = new Set(userLikes.map(l => l.post_id));
      const sharedPostIds = new Set(userShares.map(s => s.post_id));

      posts.forEach(post => {
        post.isLikedByUser = likedPostIds.has(post.id);
        post.isSharedByUser = sharedPostIds.has(post.id);
      });
    }

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user feed',
      error: error.message
    });
  }
};
