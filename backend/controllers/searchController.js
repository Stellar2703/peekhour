import db from '../config/database.js';

// Advanced search (posts, users, departments, hashtags)
export const advancedSearch = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const {
      query,
      type = 'all', // all, posts, users, departments, hashtags
      sortBy = 'relevance', // relevance, recent, popular
      dateFrom,
      dateTo,
      hasMedia,
      mediaType,
      country,
      state,
      city,
      area,
      department,
      page = 1,
      limit = 20,
    } = req.query;

    // Make query optional for location/department filtering
    const searchTerm = query ? `%${query}%` : null;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const results = {};

    // Search posts
    if (type === 'all' || type === 'posts') {
      let postQuery = `
        SELECT 
          p.*,
          u.username, u.name,
          d.name as department_name,
          (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as reaction_count,
          (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN departments d ON p.department_id = d.id
        WHERE p.is_active = TRUE
      `;

      const postParams = [];

      // Add search term if provided
      if (searchTerm) {
        postQuery += ' AND p.content LIKE ?';
        postParams.push(searchTerm);
      }

      // Add location filters
      if (country) {
        postQuery += ' AND p.country = ?';
        postParams.push(country);
      }
      if (state) {
        postQuery += ' AND p.state = ?';
        postParams.push(state);
      }
      if (city) {
        postQuery += ' AND p.city = ?';
        postParams.push(city);
      }
      if (area) {
        postQuery += ' AND p.area = ?';
        postParams.push(area);
      }

      // Add department filter
      if (department) {
        postQuery += ' AND d.name = ?';
        postParams.push(department);
      }

      // Add date filters
      if (dateFrom) {
        postQuery += ' AND p.post_date >= ?';
        postParams.push(dateFrom);
      }
      if (dateTo) {
        postQuery += ' AND p.post_date <= ?';
        postParams.push(dateTo);
      }

      // Add media filters
      if (hasMedia === 'true' || hasMedia === true) {
        postQuery += ' AND p.media_url IS NOT NULL';
      }
      if (mediaType && mediaType !== 'all') {
        postQuery += ' AND p.media_type = ?';
        postParams.push(mediaType);
      }

      // Add sorting
      if (sortBy === 'recent') {
        postQuery += ' ORDER BY p.post_date DESC, p.created_at DESC';
      } else if (sortBy === 'popular') {
        postQuery += ' ORDER BY reaction_count DESC, comment_count DESC';
      } else {
        postQuery += ' ORDER BY p.created_at DESC';
      }

      postQuery += ' LIMIT ? OFFSET ?';
      postParams.push(parseInt(limit), offset);

      const [posts] = await connection.query(postQuery, postParams);
      results.posts = posts;
    }

    // Search users
    if (type === 'all' || type === 'users') {
      if (searchTerm) {
        const [users] = await connection.query(
          `SELECT 
            u.*,
            (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as follower_count,
            (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND is_active = TRUE) as post_count
           FROM users u
           WHERE u.username LIKE ? OR u.name LIKE ? OR u.bio LIKE ?
           LIMIT ? OFFSET ?`,
          [searchTerm, searchTerm, searchTerm, parseInt(limit), offset]
        );
        results.users = users;
      } else {
        results.users = [];
      }
    }

    // Search departments
    if (type === 'all' || type === 'departments') {
      if (searchTerm) {
        const [departments] = await connection.query(
          `SELECT 
            d.*,
            (SELECT COUNT(*) FROM department_members WHERE department_id = d.id) as member_count,
            (SELECT COUNT(*) FROM posts WHERE department_id = d.id AND is_active = TRUE) as post_count
           FROM departments d
           WHERE d.name LIKE ? OR d.description LIKE ?
           LIMIT ? OFFSET ?`,
          [searchTerm, searchTerm, parseInt(limit), offset]
        );
        results.departments = departments;
      } else {
        results.departments = [];
      }
    }

    // Search hashtags
    if (type === 'all' || type === 'hashtags') {
      if (searchTerm) {
        const [hashtags] = await connection.query(
          `SELECT 
            h.name,
            COUNT(ph.post_id) as post_count
           FROM hashtags h
           JOIN post_hashtags ph ON h.id = ph.hashtag_id
           WHERE h.name LIKE ?
           GROUP BY h.id
           ORDER BY post_count DESC
           LIMIT ? OFFSET ?`,
          [searchTerm, parseInt(limit), offset]
        );
        results.hashtags = hashtags;
      } else {
        results.hashtags = [];
      }
    }

    connection.release();

    res.json({ success: true, data: results });
  } catch (error) {
    connection.release();
    console.error('Advanced search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
};

// Get trending content
export const getTrending = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { period = '24h', limit = 20 } = req.query;

    let timeCondition = '';
    if (period === '24h') {
      timeCondition = 'p.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)';
    } else if (period === '7d') {
      timeCondition = 'p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (period === '30d') {
      timeCondition = 'p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    }

    // Trending posts
    const [posts] = await connection.query(
      `SELECT 
        p.*,
        u.username, u.name,
        (SELECT COUNT(*) FROM post_reactions WHERE post_id = p.id) as reaction_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        (reaction_count * 2 + comment_count) as engagement_score
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.is_active = TRUE AND ${timeCondition}
       ORDER BY engagement_score DESC
       LIMIT ?`,
      [parseInt(limit)]
    );

    // Trending hashtags
    const [hashtags] = await connection.query(
      `SELECT 
        h.name,
        COUNT(ph.post_id) as post_count
       FROM hashtags h
       JOIN post_hashtags ph ON h.id = ph.hashtag_id
       JOIN posts p ON ph.post_id = p.id
       WHERE ${timeCondition}
       GROUP BY h.id
       ORDER BY post_count DESC
       LIMIT 10`
    );

    connection.release();

    res.json({
      success: true,
      data: {
        posts,
        hashtags,
      },
    });
  } catch (error) {
    connection.release();
    console.error('Get trending error:', error);
    res.status(500).json({ error: 'Failed to get trending content' });
  }
};

// Get explore/discover feed
export const getExplore = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get posts from users you don't follow + popular departments
    let query = `
      SELECT 
        p.*,
        u.username, u.name,
        d.name as department_name,
        (SELECT COUNT(*) FROM post_reactions WHERE post_id = p.id) as reaction_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE p.is_active = TRUE
    `;

    const params = [];

    if (userId) {
      query += ` AND p.user_id NOT IN (
        SELECT following_id FROM follows WHERE follower_id = ? AND status = 'accepted'
      ) AND p.user_id != ?`;
      params.push(userId, userId);
    }

    query += ' ORDER BY reaction_count DESC, comment_count DESC, p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [posts] = await connection.query(query, params);

    connection.release();

    res.json({ success: true, data: posts });
  } catch (error) {
    connection.release();
    console.error('Get explore error:', error);
    res.status(500).json({ error: 'Failed to get explore feed' });
  }
};

// Get suggested users to follow
export const getSuggestedUsers = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    // Get users with mutual connections or popular users
    const [users] = await connection.query(
      `SELECT 
        u.*,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id AND status = 'accepted') as follower_count,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND is_active = TRUE) as post_count,
        (
          SELECT COUNT(*) FROM follows f1
          JOIN follows f2 ON f1.following_id = f2.follower_id
          WHERE f1.follower_id = ? AND f2.following_id = u.id
          AND f1.status = 'accepted' AND f2.status = 'accepted'
        ) as mutual_connections
       FROM users u
       WHERE u.id != ?
         AND u.id NOT IN (
           SELECT following_id FROM follows WHERE follower_id = ? AND status = 'accepted'
         )
         AND u.id NOT IN (
           SELECT blocked_id FROM blocked_users WHERE blocker_id = ?
         )
       ORDER BY mutual_connections DESC, follower_count DESC
       LIMIT ?`,
      [userId, userId, userId, userId, parseInt(limit)]
    );

    connection.release();

    res.json({ success: true, data: users });
  } catch (error) {
    connection.release();
    console.error('Get suggested users error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
};
