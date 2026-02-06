import db from '../config/database.js';

// Create or get a conversation between two users
export const getOrCreateConversation = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const userId = req.user.id;
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient ID is required' });
    }

    if (parseInt(recipientId) === userId) {
      return res.status(400).json({ error: 'Cannot message yourself' });
    }

    // Check if recipient exists
    const [users] = await connection.query('SELECT id FROM users WHERE id = ?', [recipientId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Check if blocked
    const [blocked] = await connection.query(
      `SELECT id FROM blocked_users 
       WHERE (user_id = ? AND blocked_user_id = ?) OR (user_id = ? AND blocked_user_id = ?)`,
      [userId, recipientId, recipientId, userId]
    );

    if (blocked.length > 0) {
      return res.status(403).json({ error: 'Cannot message this user' });
    }

    await connection.beginTransaction();

    // Check if conversation already exists
    const [existingConv] = await connection.query(
      `SELECT c.* FROM conversations c
       JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
       JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
       WHERE c.is_group = FALSE
       AND cp1.user_id = ? AND cp2.user_id = ?`,
      [userId, recipientId]
    );

    if (existingConv.length > 0) {
      await connection.commit();
      connection.release();
      return res.json({ success: true, data: existingConv[0] });
    }

    // Create new conversation
    const [convResult] = await connection.query(
      'INSERT INTO conversations (is_group, created_by) VALUES (FALSE, ?)',
      [userId]
    );

    const conversationId = convResult.insertId;

    // Add participants
    await connection.query(
      'INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?), (?, ?)',
      [conversationId, userId, conversationId, recipientId]
    );

    const [newConv] = await connection.query(
      'SELECT * FROM conversations WHERE id = ?',
      [conversationId]
    );

    await connection.commit();
    connection.release();

    res.json({ success: true, data: newConv[0] });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Get or create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
};

// Get all conversations for a user
export const getConversations = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const userId = req.user.id;

    const [conversations] = await connection.query(
      `SELECT 
        c.*,
        -- Get the other participant's info for direct messages
        (
          SELECT JSON_OBJECT(
            'id', u.id,
            'username', u.username,
            'name', u.name,
            'avatar', u.avatar
          )
          FROM conversation_participants cp
          JOIN users u ON cp.user_id = u.id
          WHERE cp.conversation_id = c.id
          AND cp.user_id != ?
          LIMIT 1
        ) as other_user,
        -- Get last message
        (
          SELECT JSON_OBJECT(
            'content', m.content,
            'created_at', m.created_at,
            'sender_id', m.sender_id,
            'is_read', m.is_read
          )
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as last_message,
        -- Get unread count
        (
          SELECT COUNT(*)
          FROM messages m
          JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
          WHERE m.conversation_id = c.id
          AND cp.user_id = ?
          AND m.sender_id != ?
          AND m.is_read = FALSE
        ) as unread_count
       FROM conversations c
       JOIN conversation_participants cp ON c.id = cp.conversation_id
       WHERE cp.user_id = ?
       ORDER BY c.updated_at DESC`,
      [userId, userId, userId, userId]
    );

    connection.release();

    res.json({ success: true, data: conversations });
  } catch (error) {
    connection.release();
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { content, messageType = 'text' } = req.body;

    if (!content && messageType === 'text') {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Verify user is participant
    const [participants] = await connection.query(
      'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [conversationId, userId]
    );

    if (participants.length === 0) {
      return res.status(403).json({ error: 'Not a participant of this conversation' });
    }

    const mediaUrl = req.file ? `/uploads/media/${req.file.filename}` : null;

    await connection.beginTransaction();

    // Insert message
    const [result] = await connection.query(
      'INSERT INTO messages (conversation_id, sender_id, content, message_type, media_url) VALUES (?, ?, ?, ?, ?)',
      [conversationId, userId, content, messageType, mediaUrl]
    );

    // Update conversation timestamp
    await connection.query(
      'UPDATE conversations SET updated_at = NOW() WHERE id = ?',
      [conversationId]
    );

    // Get full message with sender info
    const [message] = await connection.query(
      `SELECT 
        m.*,
        u.username, u.name, u.avatar
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.id = ?`,
      [result.insertId]
    );

    await connection.commit();
    connection.release();

    res.json({ success: true, data: message[0] });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Get messages in a conversation
export const getMessages = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Verify user is participant
    const [participants] = await connection.query(
      'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [conversationId, userId]
    );

    if (participants.length === 0) {
      return res.status(403).json({ error: 'Not a participant of this conversation' });
    }

    const [messages] = await connection.query(
      `SELECT 
        m.*,
        u.username, u.name, u.avatar
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [conversationId, limit, offset]
    );

    connection.release();

    res.json({ success: true, data: messages.reverse() });
  } catch (error) {
    connection.release();
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    // Verify user is participant
    const [participants] = await connection.query(
      'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [conversationId, userId]
    );

    if (participants.length === 0) {
      return res.status(403).json({ error: 'Not a participant of this conversation' });
    }

    // Mark all messages from other users as read
    await connection.query(
      'UPDATE messages SET is_read = TRUE WHERE conversation_id = ? AND sender_id != ? AND is_read = FALSE',
      [conversationId, userId]
    );

    // Update last_read_at
    await connection.query(
      'UPDATE conversation_participants SET last_read_at = NOW() WHERE conversation_id = ? AND user_id = ?',
      [conversationId, userId]
    );

    connection.release();

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    connection.release();
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};

// Create group conversation
export const createGroupConversation = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const userId = req.user.id;
    const { name, participantIds } = req.body;

    if (!name || !participantIds || participantIds.length === 0) {
      return res.status(400).json({ error: 'Group name and participants are required' });
    }

    await connection.beginTransaction();

    // Create conversation
    const [convResult] = await connection.query(
      'INSERT INTO conversations (is_group, group_name, created_by) VALUES (TRUE, ?, ?)',
      [name, userId]
    );

    const conversationId = convResult.insertId;

    // Add creator as participant
    const participants = [userId, ...participantIds];
    const values = participants.map(id => [conversationId, id]);

    await connection.query(
      'INSERT INTO conversation_participants (conversation_id, user_id) VALUES ?',
      [values]
    );

    const [newConv] = await connection.query(
      'SELECT * FROM conversations WHERE id = ?',
      [conversationId]
    );

    await connection.commit();
    connection.release();

    res.json({ success: true, data: newConv[0] });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Create group conversation error:', error);
    res.status(500).json({ error: 'Failed to create group conversation' });
  }
};

// Delete conversation
export const deleteConversation = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    // Verify user is participant
    const [participants] = await connection.query(
      'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [conversationId, userId]
    );

    if (participants.length === 0) {
      return res.status(403).json({ error: 'Not a participant of this conversation' });
    }

    // For direct messages, just remove the user as participant
    // For groups, check if creator
    const [conv] = await connection.query(
      'SELECT is_group, created_by FROM conversations WHERE id = ?',
      [conversationId]
    );

    if (conv[0].is_group && conv[0].created_by !== userId) {
      // Just remove participant
      await connection.query(
        'DELETE FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
        [conversationId, userId]
      );
    } else {
      // Delete entire conversation
      await connection.query('DELETE FROM conversations WHERE id = ?', [conversationId]);
    }

    connection.release();

    res.json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    connection.release();
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
};
