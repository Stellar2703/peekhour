import db from '../config/database.js';

// Add comment to post
export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, isBold = false, isItalic = false } = req.body;
    const userId = req.user.id;

    // Check if post exists
    const [posts] = await db.query(
      'SELECT id FROM posts WHERE id = ? AND is_active = TRUE',
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Insert comment
    const [result] = await db.query(
      `INSERT INTO comments (post_id, user_id, content, is_bold, is_italic) 
       VALUES (?, ?, ?, ?, ?)`,
      [postId, userId, content, isBold, isItalic]
    );

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        commentId: result.insertId
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
};

// Get comments for a post
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const [comments] = await db.query(
      `SELECT 
        c.*,
        u.name as author_name,
        u.username as author_username,
        u.profile_avatar as author_avatar
       FROM comments c
       INNER JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ? AND c.is_active = TRUE
       ORDER BY c.created_at ASC
       LIMIT ? OFFSET ?`,
      [postId, parseInt(limit), offset]
    );

    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM comments WHERE post_id = ? AND is_active = TRUE',
      [postId]
    );

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
      error: error.message
    });
  }
};

// Update comment
export const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Check if comment belongs to user
    const [comments] = await db.query(
      'SELECT user_id FROM comments WHERE id = ?',
      [id]
    );

    if (comments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (comments[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment'
      });
    }

    // Update comment
    await db.query(
      'UPDATE comments SET content = ? WHERE id = ?',
      [content, id]
    );

    res.json({
      success: true,
      message: 'Comment updated successfully'
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment',
      error: error.message
    });
  }
};

// Delete comment
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if comment belongs to user
    const [comments] = await db.query(
      'SELECT user_id FROM comments WHERE id = ?',
      [id]
    );

    if (comments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (comments[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    // Soft delete
    await db.query(
      'UPDATE comments SET is_active = FALSE WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    });
  }
};
