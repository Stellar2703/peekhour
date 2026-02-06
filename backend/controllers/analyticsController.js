import db from '../config/database.js';

// Get user analytics
export const getUserAnalytics = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const userId = req.user.id;
    const { period = '30d' } = req.query;

    let dateCondition = '';
    if (period === '7d') {
      dateCondition = 'DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (period === '30d') {
      dateCondition = 'DATE_SUB(NOW(), INTERVAL 30 DAY)';
    } else if (period === '90d') {
      dateCondition = 'DATE_SUB(NOW(), INTERVAL 90 DAY)';
    }

    // Total stats
    const [stats] = await connection.query(
      `SELECT 
        (SELECT COUNT(*) FROM posts WHERE user_id = ? AND is_active = TRUE) as total_posts,
        (SELECT COUNT(*) FROM follows WHERE following_id = ? AND status = 'accepted') as follower_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND status = 'accepted') as following_count,
        (SELECT COUNT(*) FROM post_reactions pr JOIN posts p ON pr.post_id = p.id WHERE p.user_id = ?) as total_reactions,
        (SELECT COUNT(*) FROM comments c JOIN posts p ON c.post_id = p.id WHERE p.user_id = ?) as total_comments
      `,
      [userId, userId, userId, userId, userId]
    );

    // Follower growth over time
    const [followerGrowth] = await connection.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM follows
       WHERE following_id = ? AND status = 'accepted' AND created_at >= ${dateCondition}
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [userId]
    );

    // Post engagement over time
    const [postEngagement] = await connection.query(
      `SELECT DATE(p.created_at) as date,
        COUNT(DISTINCT pr.id) as reactions,
        COUNT(DISTINCT c.id) as comments
       FROM posts p
       LEFT JOIN post_reactions pr ON p.id = pr.post_id
       LEFT JOIN comments c ON p.id = c.post_id
       WHERE p.user_id = ? AND p.created_at >= ${dateCondition}
       GROUP BY DATE(p.created_at)
       ORDER BY date ASC`,
      [userId]
    );

    // Top posts by engagement
    const [topPosts] = await connection.query(
      `SELECT 
        p.*,
        (SELECT COUNT(*) FROM post_reactions WHERE post_id = p.id) as reaction_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        (reaction_count + comment_count) as total_engagement
       FROM posts p
       WHERE p.user_id = ? AND p.is_active = TRUE AND p.created_at >= ${dateCondition}
       ORDER BY total_engagement DESC
       LIMIT 5`,
      [userId]
    );

    connection.release();

    res.json({
      success: true,
      data: {
        stats: stats[0],
        followerGrowth,
        postEngagement,
        topPosts,
      },
    });
  } catch (error) {
    connection.release();
    console.error('Get user analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
};

// Get post analytics
export const getPostAnalytics = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Verify post ownership
    const [posts] = await connection.query(
      'SELECT user_id FROM posts WHERE id = ?',
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (posts[0].user_id !== userId) {
      return res.status(403).json({ error: 'You can only view analytics for your own posts' });
    }

    // Get or create analytics record
    await connection.query(
      'INSERT INTO post_analytics (post_id) VALUES (?) ON DUPLICATE KEY UPDATE post_id = post_id',
      [postId]
    );

    const [analytics] = await connection.query(
      'SELECT * FROM post_analytics WHERE post_id = ?',
      [postId]
    );

    // Reaction breakdown
    const [reactions] = await connection.query(
      `SELECT reaction_type, COUNT(*) as count
       FROM post_reactions
       WHERE post_id = ?
       GROUP BY reaction_type`,
      [postId]
    );

    // Comments count
    const [comments] = await connection.query(
      'SELECT COUNT(*) as count FROM comments WHERE post_id = ?',
      [postId]
    );

    // Shares count (if sharing is implemented)
    const [shares] = await connection.query(
      'SELECT COUNT(*) as count FROM post_shares WHERE post_id = ?',
      [postId]
    );

    connection.release();

    res.json({
      success: true,
      data: {
        ...analytics[0],
        reactions,
        comment_count: comments[0].count,
        share_count: shares[0].count,
      },
    });
  } catch (error) {
    connection.release();
    console.error('Get post analytics error:', error);
    res.status(500).json({ error: 'Failed to get post analytics' });
  }
};

// Get department analytics (admin/moderator only)
export const getDepartmentAnalytics = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { departmentId } = req.params;
    const { period = '30d' } = req.query;

    let dateCondition = '';
    if (period === '7d') {
      dateCondition = 'DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (period === '30d') {
      dateCondition = 'DATE_SUB(NOW(), INTERVAL 30 DAY)';
    } else if (period === '90d') {
      dateCondition = 'DATE_SUB(NOW(), INTERVAL 90 DAY)';
    }

    // Total stats
    const [stats] = await connection.query(
      `SELECT 
        (SELECT COUNT(*) FROM department_members WHERE department_id = ?) as member_count,
        (SELECT COUNT(*) FROM posts WHERE department_id = ? AND is_active = TRUE) as total_posts,
        (SELECT COUNT(*) FROM posts p 
         JOIN post_reactions pr ON p.id = pr.post_id 
         WHERE p.department_id = ?) as total_reactions,
        (SELECT COUNT(*) FROM posts p
         JOIN comments c ON p.id = c.post_id
         WHERE p.department_id = ?) as total_comments
      `,
      [departmentId, departmentId, departmentId, departmentId]
    );

    // Member growth over time
    const [memberGrowth] = await connection.query(
      `SELECT DATE(joined_at) as date, COUNT(*) as count
       FROM department_members
       WHERE department_id = ? AND joined_at >= ${dateCondition}
       GROUP BY DATE(joined_at)
       ORDER BY date ASC`,
      [departmentId]
    );

    // Post activity over time
    const [postActivity] = await connection.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM posts
       WHERE department_id = ? AND is_active = TRUE AND created_at >= ${dateCondition}
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [departmentId]
    );

    // Top contributors
    const [topContributors] = await connection.query(
      `SELECT 
        u.id, u.username, u.name, u.avatar,
        COUNT(p.id) as post_count,
        COUNT(DISTINCT pr.id) as reactions_received
       FROM users u
       JOIN posts p ON u.id = p.user_id
       LEFT JOIN post_reactions pr ON p.id = pr.post_id
       WHERE p.department_id = ? AND p.is_active = TRUE AND p.created_at >= ${dateCondition}
       GROUP BY u.id
       ORDER BY post_count DESC, reactions_received DESC
       LIMIT 10`,
      [departmentId]
    );

    connection.release();

    res.json({
      success: true,
      data: {
        stats: stats[0],
        memberGrowth,
        postActivity,
        topContributors,
      },
    });
  } catch (error) {
    connection.release();
    console.error('Get department analytics error:', error);
    res.status(500).json({ error: 'Failed to get department analytics' });
  }
};

// Track analytics event
export const trackEvent = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { eventType, targetType, targetId } = req.body;
    const userId = req.user?.id;

    // Update analytics based on event type
    if (eventType === 'post_view' && targetType === 'post') {
      await connection.query(
        'UPDATE post_analytics SET views = views + 1 WHERE post_id = ?',
        [targetId]
      );
    } else if (eventType === 'post_click' && targetType === 'post') {
      await connection.query(
        'UPDATE post_analytics SET clicks = clicks + 1 WHERE post_id = ?',
        [targetId]
      );
    }

    connection.release();

    res.json({ success: true, message: 'Event tracked' });
  } catch (error) {
    connection.release();
    console.error('Track event error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
};
