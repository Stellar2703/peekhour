import db from '../config/database.js';

// Create notification
const createNotification = async (userId, type, content, relatedId = null, actorId = null) => {
  const connection = await db.getConnection();
  try {
    await connection.query(
      `INSERT INTO notifications (user_id, type, content, related_id, actor_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, type, content, relatedId, actorId]
    );
    connection.release();
  } catch (error) {
    connection.release();
    console.error('Create notification error:', error);
  }
};

// Get user notifications
export const getNotifications = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const userId = req.user.id;
    const { type, unreadOnly = 'false', page = 1, limit = 20 } = req.query;

    let query = `
      SELECT 
        n.*,
        u.username as actor_username, u.name as actor_name, u.avatar as actor_avatar
      FROM notifications n
      LEFT JOIN users u ON n.actor_id = u.id
      WHERE n.user_id = ?
    `;

    const params = [userId];

    if (type) {
      query += ' AND n.type = ?';
      params.push(type);
    }

    if (unreadOnly === 'true') {
      query += ' AND n.is_read = FALSE';
    }

    query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const [notifications] = await connection.query(query, params);

    connection.release();

    res.json({ success: true, data: notifications });
  } catch (error) {
    connection.release();
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    await connection.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    connection.release();

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    connection.release();
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const userId = req.user.id;

    await connection.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    connection.release();

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    connection.release();
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    await connection.query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    connection.release();

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    connection.release();
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const userId = req.user.id;

    const [result] = await connection.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    connection.release();

    res.json({ success: true, data: { count: result[0].count } });
  } catch (error) {
    connection.release();
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

// Get notification settings
export const getNotificationSettings = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const userId = req.user.id;

    const [settings] = await connection.query(
      'SELECT * FROM notification_settings WHERE user_id = ?',
      [userId]
    );

    if (settings.length === 0) {
      // Create default settings
      const defaults = {
        email_on_follow: true,
        email_on_comment: true,
        email_on_mention: true,
        email_on_post_reaction: false,
        email_on_comment_reaction: false,
        email_on_message: true,
        email_on_event_reminder: true,
        push_on_follow: true,
        push_on_comment: true,
        push_on_mention: true,
        push_on_post_reaction: true,
        push_on_comment_reaction: true,
        push_on_message: true,
        push_on_event_reminder: true,
      };

      await connection.query(
        `INSERT INTO notification_settings (user_id, email_on_follow, email_on_comment, email_on_mention, 
         email_on_post_reaction, email_on_comment_reaction, email_on_message, email_on_event_reminder,
         push_on_follow, push_on_comment, push_on_mention, push_on_post_reaction, 
         push_on_comment_reaction, push_on_message, push_on_event_reminder) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          defaults.email_on_follow,
          defaults.email_on_comment,
          defaults.email_on_mention,
          defaults.email_on_post_reaction,
          defaults.email_on_comment_reaction,
          defaults.email_on_message,
          defaults.email_on_event_reminder,
          defaults.push_on_follow,
          defaults.push_on_comment,
          defaults.push_on_mention,
          defaults.push_on_post_reaction,
          defaults.push_on_comment_reaction,
          defaults.push_on_message,
          defaults.push_on_event_reminder,
        ]
      );

      connection.release();
      return res.json({ success: true, data: defaults });
    }

    connection.release();

    res.json({ success: true, data: settings[0] });
  } catch (error) {
    connection.release();
    console.error('Get notification settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
};

// Update notification settings
export const updateNotificationSettings = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const userId = req.user.id;
    const settings = req.body;

    const updates = [];
    const params = [];

    Object.keys(settings).forEach((key) => {
      if (key.startsWith('email_') || key.startsWith('push_')) {
        updates.push(`${key} = ?`);
        params.push(settings[key]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid settings provided' });
    }

    params.push(userId);

    await connection.query(
      `UPDATE notification_settings SET ${updates.join(', ')} WHERE user_id = ?`,
      params
    );

    connection.release();

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    connection.release();
    console.error('Update notification settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

// Helper function to create notification for follow
export const notifyFollow = async (followerId, followingId) => {
  const connection = await db.getConnection();
  try {
    const [follower] = await connection.query(
      'SELECT username FROM users WHERE id = ?',
      [followerId]
    );
    
    await createNotification(
      followingId,
      'follow',
      `@${follower[0].username} started following you`,
      followerId,
      followerId
    );
    
    connection.release();
  } catch (error) {
    connection.release();
    console.error('Notify follow error:', error);
  }
};

// Helper function to create notification for comment
export const notifyComment = async (postId, commenterId, postOwnerId) => {
  if (commenterId === postOwnerId) return; // Don't notify yourself

  const connection = await db.getConnection();
  try {
    const [commenter] = await connection.query(
      'SELECT username FROM users WHERE id = ?',
      [commenterId]
    );
    
    await createNotification(
      postOwnerId,
      'comment',
      `@${commenter[0].username} commented on your post`,
      postId,
      commenterId
    );
    
    connection.release();
  } catch (error) {
    connection.release();
    console.error('Notify comment error:', error);
  }
};

// Helper function to create notification for mention
export const notifyMention = async (mentionerId, mentionedId, postId) => {
  const connection = await db.getConnection();
  try {
    const [mentioner] = await connection.query(
      'SELECT username FROM users WHERE id = ?',
      [mentionerId]
    );
    
    await createNotification(
      mentionedId,
      'mention',
      `@${mentioner[0].username} mentioned you in a post`,
      postId,
      mentionerId
    );
    
    connection.release();
  } catch (error) {
    connection.release();
    console.error('Notify mention error:', error);
  }
};

// Helper function to create notification for reaction
export const notifyReaction = async (reactorId, postOwnerId, postId, reactionType) => {
  if (reactorId === postOwnerId) return; // Don't notify yourself

  const connection = await db.getConnection();
  try {
    const [reactor] = await connection.query(
      'SELECT username FROM users WHERE id = ?',
      [reactorId]
    );
    
    await createNotification(
      postOwnerId,
      'post_reaction',
      `@${reactor[0].username} reacted ${reactionType} to your post`,
      postId,
      reactorId
    );
    
    connection.release();
  } catch (error) {
    connection.release();
    console.error('Notify reaction error:', error);
  }
};

export { createNotification };
