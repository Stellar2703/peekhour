import db from '../config/database.js';
import { extractHashtags, extractMentions, saveHashtags, saveMentions } from './postEnhancementsController.js';

// Create a new post
export const createPost = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const {
      content,
      mediaType = 'none',
      departmentId,
      country = 'India',
      state = '',
      city = '',
      area,
      street,
      pinCode,
      latitude,
      longitude
    } = req.body;

    const userId = req.user.id;
    const postDate = new Date().toISOString().split('T')[0]; // Current date

    // Validate department membership if posting to department
    if (departmentId) {
      const [membership] = await db.query(
        `SELECT dm.id FROM department_members dm
         INNER JOIN departments d ON dm.department_id = d.id
         WHERE (dm.user_id = ? OR d.created_by = ?) AND dm.department_id = ?`,
        [userId, userId, departmentId]
      );

      if (membership.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You must be a member of this department to post'
        });
      }
    }

    // Get media URL if file uploaded
    const mediaUrl = req.file ? `/uploads/media/${req.file.filename}` : null;

    // Insert post
    const [result] = await db.query(
      `INSERT INTO posts 
       (user_id, department_id, content, media_type, media_url, country, state, city, area, street, pin_code, latitude, longitude, post_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, departmentId || null, content, mediaType, mediaUrl, country, state, city, area || null, street || null, pinCode || null, latitude || null, longitude || null, postDate]
    );

    const postId = result.insertId;

    // Extract and save hashtags and mentions
    const hashtags = extractHashtags(content);
    const mentions = extractMentions(content);

    await saveHashtags(connection, postId, hashtags);
    await saveMentions(connection, postId, mentions, userId);

    // Save location to user_locations for future use
    if (country && state && city) {
      await connection.query(
        `INSERT INTO user_locations (user_id, country, state, city, area, street, pin_code) 
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE last_used_at = CURRENT_TIMESTAMP`,
        [userId, country, state, city, area || null, street || null, pinCode || null]
      );
    }

    connection.release();

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        postId: postId
      }
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post',
      error: error.message
    });
  }
};

// Get posts with filters
export const getPosts = async (req, res) => {
  try {
    const {
      departmentId,
      country,
      state,
      city,
      area,
      street,
      pinCode,
      startDate,
      endDate,
      username,
      page = 1,
      limit = 10
    } = req.query;

    const offset = (page - 1) * limit;

    let whereConditions = ['p.is_active = TRUE'];
    let queryParams = [];

    // Build WHERE conditions
    if (departmentId) {
      whereConditions.push('p.department_id = ?');
      queryParams.push(departmentId);
    }
    if (country) {
      whereConditions.push('p.country = ?');
      queryParams.push(country);
    }
    if (state) {
      whereConditions.push('p.state = ?');
      queryParams.push(state);
    }
    if (city) {
      whereConditions.push('p.city = ?');
      queryParams.push(city);
    }
    if (area) {
      whereConditions.push('p.area = ?');
      queryParams.push(area);
    }
    if (street) {
      whereConditions.push('p.street LIKE ?');
      queryParams.push(`%${street}%`);
    }
    if (pinCode) {
      whereConditions.push('p.pin_code = ?');
      queryParams.push(pinCode);
    }
    if (startDate) {
      whereConditions.push('p.post_date >= ?');
      queryParams.push(startDate);
    }
    if (endDate) {
      whereConditions.push('p.post_date <= ?');
      queryParams.push(endDate);
    }
    if (username) {
      whereConditions.push('u.username = ?');
      queryParams.push(username);
    }

    const whereClause = whereConditions.join(' AND ');

    // Additional filter: Only show public posts OR department posts user is member of
    let accessFilter = '';
    let accessParams = [];
    if (req.user) {
      accessFilter = `AND (
        p.department_id IS NULL 
        OR p.department_id IN (
          SELECT dm.department_id FROM department_members dm WHERE dm.user_id = ?
          UNION
          SELECT d.id FROM departments d WHERE d.created_by = ?
        )
      )`;
      accessParams = [req.user.id, req.user.id];
    } else {
      // Non-authenticated users only see public posts
      accessFilter = 'AND p.department_id IS NULL';
    }

    // Get posts
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
       WHERE ${whereClause} ${accessFilter}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, ...accessParams, parseInt(limit), offset]
    );

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM posts p
       INNER JOIN users u ON p.user_id = u.id
       WHERE ${whereClause} ${accessFilter}`,
      [...queryParams, ...accessParams]
    );

    const total = countResult[0].total;

    // Check if current user liked/shared posts (if authenticated)
    if (req.user) {
      const postIds = posts.map(p => p.id);
      if (postIds.length > 0) {
        const placeholders = postIds.map(() => '?').join(',');
        const [userLikes] = await db.query(
          `SELECT post_id FROM post_likes WHERE user_id = ? AND post_id IN (${placeholders})`,
          [req.user.id, ...postIds]
        );
        const [userShares] = await db.query(
          `SELECT post_id FROM post_shares WHERE user_id = ? AND post_id IN (${placeholders})`,
          [req.user.id, ...postIds]
        );

        const likedPostIds = new Set(userLikes.map(l => l.post_id));
        const sharedPostIds = new Set(userShares.map(s => s.post_id));

        posts.forEach(post => {
          post.isLikedByUser = likedPostIds.has(post.id);
          post.isSharedByUser = sharedPostIds.has(post.id);
        });
      }
    }

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts',
      error: error.message
    });
  }
};

// Get single post by ID
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

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
       WHERE p.id = ? AND p.is_active = TRUE`,
      [id]
    );

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const post = posts[0];

    // Check if current user liked/shared (if authenticated)
    if (req.user) {
      const [likes] = await db.query(
        'SELECT id FROM post_likes WHERE user_id = ? AND post_id = ?',
        [req.user.id, id]
      );
      const [shares] = await db.query(
        'SELECT id FROM post_shares WHERE user_id = ? AND post_id = ?',
        [req.user.id, id]
      );

      post.isLikedByUser = likes.length > 0;
      post.isSharedByUser = shares.length > 0;
    }

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch post',
      error: error.message
    });
  }
};

// Update post
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Check if post belongs to user
    const [posts] = await db.query(
      'SELECT user_id FROM posts WHERE id = ?',
      [id]
    );

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (posts[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      });
    }

    // Update post
    await db.query(
      'UPDATE posts SET content = ? WHERE id = ?',
      [content, id]
    );

    res.json({
      success: true,
      message: 'Post updated successfully'
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update post',
      error: error.message
    });
  }
};

// Delete post
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if post belongs to user
    const [posts] = await db.query(
      'SELECT user_id FROM posts WHERE id = ?',
      [id]
    );

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (posts[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    // Soft delete
    await db.query(
      'UPDATE posts SET is_active = FALSE WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post',
      error: error.message
    });
  }
};

// Like/Unlike post
export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    // Prevent liking own posts
    const [postCheck] = await db.query(
      'SELECT user_id FROM posts WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (postCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (postCheck[0].user_id === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot like your own post'
      });
    }
    // Check if already liked
    const [existing] = await db.query(
      'SELECT id FROM post_likes WHERE user_id = ? AND post_id = ?',
      [userId, id]
    );

    if (existing.length > 0) {
      // Unlike
      await db.query(
        'DELETE FROM post_likes WHERE user_id = ? AND post_id = ?',
        [userId, id]
      );

      return res.json({
        success: true,
        message: 'Post unliked',
        data: { liked: false }
      });
    } else {
      // Like
      await db.query(
        'INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)',
        [userId, id]
      );

      // Create notification for post author
      const postAuthorId = postCheck[0].user_id;
      if (postAuthorId !== userId) { // Don't notify if liking own post
        await db.query(
          `INSERT INTO notifications (user_id, type, message, content, post_id, from_user_id) 
           VALUES (?, 'like', 'liked your post', 'liked your post', ?, ?)`,
          [postAuthorId, id, userId]
        );
      }

      return res.json({
        success: true,
        message: 'Post liked',
        data: { liked: true }
      });
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle like',
      error: error.message
    });
  }
};

// Share/Unshare post
export const toggleShare = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    // Prevent sharing own posts
    const [postCheck] = await db.query(
      'SELECT user_id FROM posts WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (postCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (postCheck[0].user_id === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot share your own post'
      });
    }
    // Check if already shared
    const [existing] = await db.query(
      'SELECT id FROM post_shares WHERE user_id = ? AND post_id = ?',
      [userId, id]
    );

    if (existing.length > 0) {
      // Unshare
      await db.query(
        'DELETE FROM post_shares WHERE user_id = ? AND post_id = ?',
        [userId, id]
      );

      return res.json({
        success: true,
        message: 'Post unshared',
        data: { shared: false }
      });
    } else {
      // Share
      await db.query(
        'INSERT INTO post_shares (user_id, post_id) VALUES (?, ?)',
        [userId, id]
      );

      return res.json({
        success: true,
        message: 'Post shared',
        data: { shared: true }
      });
    }
  } catch (error) {
    console.error('Toggle share error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle share',
      error: error.message
    });
  }
};
