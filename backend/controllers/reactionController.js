import db from '../config/database.js';

// Toggle reaction on a post
export const togglePostReaction = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const { reactionType = 'like' } = req.body;
    const userId = req.user.id;

    // Validate reaction type
    const validReactions = ['like', 'love', 'wow', 'sad', 'angry', 'celebrate'];
    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({ error: 'Invalid reaction type' });
    }

    // Check if post exists
    const [posts] = await connection.query('SELECT user_id FROM posts WHERE id = ?', [id]);
    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const postOwnerId = posts[0].user_id;

    // Prevent self-reactions
    if (parseInt(postOwnerId) === userId) {
      return res.status(400).json({ error: 'Cannot react to your own post' });
    }

    await connection.beginTransaction();

    // Check if user already reacted
    const [existing] = await connection.query(
      'SELECT id, reaction_type FROM post_reactions WHERE post_id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length > 0) {
      if (existing[0].reaction_type === reactionType) {
        // Remove reaction if same type
        await connection.query(
          'DELETE FROM post_reactions WHERE post_id = ? AND user_id = ?',
          [id, userId]
        );

        await connection.commit();
        connection.release();

        return res.json({
          success: true,
          message: 'Reaction removed',
          data: { reacted: false, reactionType: null }
        });
      } else {
        // Update to new reaction type
        await connection.query(
          'UPDATE post_reactions SET reaction_type = ?, created_at = NOW() WHERE post_id = ? AND user_id = ?',
          [reactionType, id, userId]
        );

        // Create notification for new reaction
        await connection.query(
          `INSERT INTO notifications (user_id, type, notification_type, content, post_id, from_user_id, data) 
           VALUES (?, 'reaction', 'like', 'reacted to your post', ?, ?, JSON_OBJECT('action', 'reaction', 'reactionType', ?))`,
          [postOwnerId, id, userId, reactionType]
        );

        await connection.commit();
        connection.release();

        return res.json({
          success: true,
          message: 'Reaction updated',
          data: { reacted: true, reactionType }
        });
      }
    } else {
      // Add new reaction
      await connection.query(
        'INSERT INTO post_reactions (post_id, user_id, reaction_type) VALUES (?, ?, ?)',
        [id, userId, reactionType]
      );

      // Create notification
      await connection.query(
        `INSERT INTO notifications (user_id, type, notification_type, content, post_id, from_user_id, data) 
         VALUES (?, 'reaction', 'like', 'reacted to your post', ?, ?, JSON_OBJECT('action', 'reaction', 'reactionType', ?))`,
        [postOwnerId, id, userId, reactionType]
      );

      await connection.commit();
      connection.release();

      return res.json({
        success: true,
        message: 'Reaction added',
        data: { reacted: true, reactionType }
      });
    }
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Toggle reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle reaction',
      error: error.message
    });
  }
};

// Get reactions for a post
export const getPostReactions = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;

    // Get reaction counts by type
    const [reactions] = await connection.query(
      `SELECT 
        reaction_type,
        COUNT(*) as count
       FROM post_reactions
       WHERE post_id = ?
       GROUP BY reaction_type`,
      [id]
    );

    // Get users who reacted (limit to recent 20 per type)
    const [recentReactions] = await connection.query(
      `SELECT 
        pr.reaction_type,
        u.id, u.username, u.name, u.avatar,
        pr.created_at
       FROM post_reactions pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.post_id = ?
       ORDER BY pr.created_at DESC
       LIMIT 20`,
      [id]
    );

    // Get total count
    const totalCount = reactions.reduce((sum, r) => sum + parseInt(r.count), 0);

    connection.release();

    res.json({
      success: true,
      data: {
        reactions: reactions,
        recentReactions: recentReactions,
        totalCount: totalCount
      }
    });
  } catch (error) {
    connection.release();
    console.error('Get post reactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reactions',
      error: error.message
    });
  }
};

// Toggle reaction on a comment
export const toggleCommentReaction = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const { reactionType = 'like' } = req.body;
    const userId = req.user.id;

    // Validate reaction type
    const validReactions = ['like', 'love', 'wow', 'sad', 'angry'];
    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({ error: 'Invalid reaction type' });
    }

    // Check if comment exists
    const [comments] = await connection.query('SELECT user_id FROM comments WHERE id = ?', [id]);
    if (comments.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const commentOwnerId = comments[0].user_id;

    // Prevent self-reactions
    if (parseInt(commentOwnerId) === userId) {
      return res.status(400).json({ error: 'Cannot react to your own comment' });
    }

    await connection.beginTransaction();

    // Check if user already reacted
    const [existing] = await connection.query(
      'SELECT id, reaction_type FROM comment_reactions WHERE comment_id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length > 0) {
      if (existing[0].reaction_type === reactionType) {
        // Remove reaction
        await connection.query(
          'DELETE FROM comment_reactions WHERE comment_id = ? AND user_id = ?',
          [id, userId]
        );

        await connection.commit();
        connection.release();

        return res.json({
          success: true,
          message: 'Reaction removed',
          data: { reacted: false, reactionType: null }
        });
      } else {
        // Update reaction
        await connection.query(
          'UPDATE comment_reactions SET reaction_type = ?, created_at = NOW() WHERE comment_id = ? AND user_id = ?',
          [reactionType, id, userId]
        );

        await connection.commit();
        connection.release();

        return res.json({
          success: true,
          message: 'Reaction updated',
          data: { reacted: true, reactionType }
        });
      }
    } else {
      // Add new reaction
      await connection.query(
        'INSERT INTO comment_reactions (comment_id, user_id, reaction_type) VALUES (?, ?, ?)',
        [id, userId, reactionType]
      );

      await connection.commit();
      connection.release();

      return res.json({
        success: true,
        message: 'Reaction added',
        data: { reacted: true, reactionType }
      });
    }
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Toggle comment reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle reaction',
      error: error.message
    });
  }
};

// Get reactions for a comment
export const getCommentReactions = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;

    const [reactions] = await connection.query(
      `SELECT 
        reaction_type,
        COUNT(*) as count
       FROM comment_reactions
       WHERE comment_id = ?
       GROUP BY reaction_type`,
      [id]
    );

    const totalCount = reactions.reduce((sum, r) => sum + parseInt(r.count), 0);

    connection.release();

    res.json({
      success: true,
      data: {
        reactions: reactions,
        totalCount: totalCount
      }
    });
  } catch (error) {
    connection.release();
    console.error('Get comment reactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reactions',
      error: error.message
    });
  }
};
