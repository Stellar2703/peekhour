import db from '../config/database.js';

// Create story
export const createStory = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { content, mediaUrl, mediaType, backgroundColor } = req.body;
    const userId = req.user.id;

    // Stories require either content or media
    if (!content && !mediaUrl) {
      return res.status(400).json({ error: 'Story must have content or media' });
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiration

    const [result] = await connection.query(
      `INSERT INTO stories 
       (user_id, content, media_url, media_type, background_color, expires_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, content || null, mediaUrl || null, mediaType || 'text', backgroundColor || '#000000', expiresAt]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Story created successfully',
      data: { storyId: result.insertId, expiresAt },
    });
  } catch (error) {
    connection.release();
    console.error('Create story error:', error);
    res.status(500).json({ error: 'Failed to create story' });
  }
};

// Get stories (following users + own stories)
export const getStories = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const userId = req.user.id;

    // Get stories from users you follow + your own stories
    const [stories] = await connection.query(
      `SELECT 
        s.*,
        u.username, u.name, u.avatar,
        (SELECT COUNT(*) FROM story_views WHERE story_id = s.id) as view_count,
        (SELECT COUNT(*) FROM story_views WHERE story_id = s.id AND user_id = ?) as user_viewed
       FROM stories s
       JOIN users u ON s.user_id = u.id
       WHERE s.expires_at > NOW() 
         AND s.is_active = TRUE
         AND (s.user_id = ? OR s.user_id IN (
           SELECT following_id FROM follows WHERE follower_id = ? AND status = 'accepted'
         ))
       ORDER BY s.created_at DESC`,
      [userId, userId, userId]
    );

    // Group stories by user
    const groupedStories = {};
    stories.forEach((story) => {
      if (!groupedStories[story.user_id]) {
        groupedStories[story.user_id] = {
          userId: story.user_id,
          username: story.username,
          name: story.name,
          avatar: story.avatar,
          stories: [],
        };
      }
      groupedStories[story.user_id].stories.push({
        id: story.id,
        content: story.content,
        mediaUrl: story.media_url,
        mediaType: story.media_type,
        backgroundColor: story.background_color,
        createdAt: story.created_at,
        expiresAt: story.expires_at,
        viewCount: story.view_count,
        userViewed: story.user_viewed > 0,
      });
    });

    connection.release();

    res.json({
      success: true,
      data: Object.values(groupedStories),
    });
  } catch (error) {
    connection.release();
    console.error('Get stories error:', error);
    res.status(500).json({ error: 'Failed to get stories' });
  }
};

// Get user's stories
export const getUserStories = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const [stories] = await connection.query(
      `SELECT 
        s.*,
        (SELECT COUNT(*) FROM story_views WHERE story_id = s.id) as view_count,
        (SELECT COUNT(*) FROM story_views WHERE story_id = s.id AND user_id = ?) as user_viewed
       FROM stories s
       WHERE s.user_id = ? AND s.expires_at > NOW() AND s.is_active = TRUE
       ORDER BY s.created_at ASC`,
      [currentUserId, userId]
    );

    connection.release();

    res.json({ success: true, data: stories });
  } catch (error) {
    connection.release();
    console.error('Get user stories error:', error);
    res.status(500).json({ error: 'Failed to get user stories' });
  }
};

// View story (track view)
export const viewStory = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    // Check if story exists and is active
    const [stories] = await connection.query(
      'SELECT * FROM stories WHERE id = ? AND expires_at > NOW() AND is_active = TRUE',
      [storyId]
    );

    if (stories.length === 0) {
      return res.status(404).json({ error: 'Story not found or expired' });
    }

    const story = stories[0];

    // Don't track view if it's the owner's story
    if (story.user_id !== userId) {
      // Check if already viewed
      const [existing] = await connection.query(
        'SELECT id FROM story_views WHERE story_id = ? AND user_id = ?',
        [storyId, userId]
      );

      if (existing.length === 0) {
        // Record view
        await connection.query(
          'INSERT INTO story_views (story_id, user_id) VALUES (?, ?)',
          [storyId, userId]
        );
      }
    }

    connection.release();

    res.json({ success: true, message: 'Story viewed' });
  } catch (error) {
    connection.release();
    console.error('View story error:', error);
    res.status(500).json({ error: 'Failed to view story' });
  }
};

// Get story viewers
export const getStoryViewers = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    // Verify story belongs to user
    const [stories] = await connection.query(
      'SELECT user_id FROM stories WHERE id = ?',
      [storyId]
    );

    if (stories.length === 0) {
      return res.status(404).json({ error: 'Story not found' });
    }

    if (stories[0].user_id !== userId) {
      return res.status(403).json({ error: 'You can only view viewers of your own stories' });
    }

    const [viewers] = await connection.query(
      `SELECT 
        sv.*,
        u.username, u.name, u.avatar
       FROM story_views sv
       JOIN users u ON sv.user_id = u.id
       WHERE sv.story_id = ?
       ORDER BY sv.viewed_at DESC`,
      [storyId]
    );

    connection.release();

    res.json({ success: true, data: viewers });
  } catch (error) {
    connection.release();
    console.error('Get story viewers error:', error);
    res.status(500).json({ error: 'Failed to get viewers' });
  }
};

// Delete story
export const deleteStory = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    // Verify story belongs to user
    const [stories] = await connection.query(
      'SELECT user_id FROM stories WHERE id = ?',
      [storyId]
    );

    if (stories.length === 0) {
      return res.status(404).json({ error: 'Story not found' });
    }

    if (stories[0].user_id !== userId) {
      return res.status(403).json({ error: 'You can only delete your own stories' });
    }

    await connection.query(
      'UPDATE stories SET is_active = FALSE WHERE id = ?',
      [storyId]
    );

    connection.release();

    res.json({ success: true, message: 'Story deleted successfully' });
  } catch (error) {
    connection.release();
    console.error('Delete story error:', error);
    res.status(500).json({ error: 'Failed to delete story' });
  }
};

// Delete expired stories (called by cron job or scheduled task)
export const deleteExpiredStories = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const [result] = await connection.query(
      'UPDATE stories SET is_active = FALSE WHERE expires_at <= NOW() AND is_active = TRUE'
    );

    connection.release();

    res.json({
      success: true,
      message: `${result.affectedRows} expired stories removed`,
    });
  } catch (error) {
    connection.release();
    console.error('Delete expired stories error:', error);
    res.status(500).json({ error: 'Failed to delete expired stories' });
  }
};
