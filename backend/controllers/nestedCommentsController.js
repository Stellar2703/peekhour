import db from '../config/database.js';

// Create a reply to a comment (nested comment)
export const createCommentReply = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { postId, parentCommentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    // Verify parent comment exists and get its depth
    const [parentComments] = await connection.query(
      'SELECT id, depth, user_id, post_id FROM comments WHERE id = ?',
      [parentCommentId]
    );

    if (parentComments.length === 0) {
      return res.status(404).json({ error: 'Parent comment not found' });
    }

    const parentComment = parentComments[0];
    const newDepth = parentComment.depth + 1;

    // Limit nesting depth to 5 levels
    if (newDepth > 5) {
      return res.status(400).json({ error: 'Maximum nesting depth reached' });
    }

    // Verify post exists
    const [posts] = await connection.query('SELECT id FROM posts WHERE id = ?', [postId]);
    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await connection.beginTransaction();

    // Create the reply
    const [result] = await connection.query(
      'INSERT INTO comments (post_id, user_id, content, parent_comment_id, depth) VALUES (?, ?, ?, ?, ?)',
      [postId, userId, content, parentCommentId, newDepth]
    );

    // Create notification for parent comment author (if not self-reply)
    if (parentComment.user_id !== userId) {
      await connection.query(
        `INSERT INTO notifications (user_id, type, notification_type, content, post_id, comment_id, from_user_id, data)
         VALUES (?, 'comment', 'comment', 'replied to your comment', ?, ?, ?, JSON_OBJECT('action', 'reply'))`,
        [parentComment.user_id, postId, result.insertId, userId]
      );
    }

    await connection.commit();

    // Fetch the created reply with user info
    const [newComment] = await connection.query(
      `SELECT 
        c.*,
        u.username, u.name, u.avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );

    connection.release();

    res.status(201).json({
      success: true,
      message: 'Reply created successfully',
      data: newComment[0]
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Create comment reply error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create reply',
      error: error.message
    });
  }
};

// Get replies for a comment
export const getCommentReplies = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { commentId } = req.params;
    const userId = req.user?.id;

    const [replies] = await connection.query(
      `SELECT 
        c.*,
        u.username, u.name, u.avatar,
        (SELECT COUNT(*) FROM comment_reactions WHERE comment_id = c.id) as reactions_count,
        ${userId ? `EXISTS(SELECT 1 FROM comment_reactions WHERE comment_id = c.id AND user_id = ${userId}) as has_reacted,` : ''}
        ${userId ? `(SELECT reaction_type FROM comment_reactions WHERE comment_id = c.id AND user_id = ${userId}) as user_reaction,` : ''}
        (SELECT COUNT(*) FROM comments WHERE parent_comment_id = c.id) as replies_count
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.parent_comment_id = ?
       ORDER BY c.created_at ASC`,
      [commentId]
    );

    connection.release();

    res.json({
      success: true,
      data: replies
    });
  } catch (error) {
    connection.release();
    console.error('Get comment replies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get replies',
      error: error.message
    });
  }
};

// Update comment
export const updateComment = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    // Verify ownership
    const [comments] = await connection.query(
      'SELECT * FROM comments WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (comments.length === 0) {
      return res.status(404).json({ error: 'Comment not found or unauthorized' });
    }

    // Update comment
    await connection.query(
      'UPDATE comments SET content = ?, edited_at = NOW() WHERE id = ?',
      [content, id]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Comment updated successfully'
    });
  } catch (error) {
    connection.release();
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
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const [comments] = await connection.query(
      'SELECT * FROM comments WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (comments.length === 0) {
      return res.status(404).json({ error: 'Comment not found or unauthorized' });
    }

    // Delete comment (cascade will handle replies)
    await connection.query('DELETE FROM comments WHERE id = ?', [id]);

    connection.release();

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    connection.release();
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    });
  }
};

// Get comment thread (comment with all nested replies)
export const getCommentThread = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { commentId } = req.params;
    const userId = req.user?.id;

    // Recursive CTE to get entire thread
    const [thread] = await connection.query(
      `WITH RECURSIVE comment_thread AS (
        -- Base case: the root comment
        SELECT 
          c.*,
          u.username, u.name, u.avatar,
          0 as level,
          CAST(c.id AS CHAR(255)) as path
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
        
        UNION ALL
        
        -- Recursive case: replies to comments in the thread
        SELECT 
          c.*,
          u.username, u.name, u.avatar,
          ct.level + 1,
          CONCAT(ct.path, '-', c.id)
        FROM comments c
        JOIN users u ON c.user_id = u.id
        JOIN comment_thread ct ON c.parent_comment_id = ct.id
        WHERE ct.level < 5
      )
      SELECT * FROM comment_thread
      ORDER BY path`,
      [commentId]
    );

    connection.release();

    res.json({
      success: true,
      data: thread
    });
  } catch (error) {
    connection.release();
    console.error('Get comment thread error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get comment thread',
      error: error.message
    });
  }
};
