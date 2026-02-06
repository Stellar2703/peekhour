import db from '../config/database.js';

// Create report
export const createReport = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { targetType, targetId, reason, description } = req.body;
    const userId = req.user.id;

    const validTypes = ['post', 'comment', 'user'];
    if (!validTypes.includes(targetType)) {
      return res.status(400).json({ error: 'Invalid target type' });
    }

    // Check if already reported
    const [existing] = await connection.query(
      'SELECT id FROM reports WHERE reporter_id = ? AND target_type = ? AND target_id = ? AND status = "pending"',
      [userId, targetType, targetId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'You have already reported this content' });
    }

    await connection.query(
      'INSERT INTO reports (reporter_id, target_type, target_id, reason, description) VALUES (?, ?, ?, ?, ?)',
      [userId, targetType, targetId, reason, description]
    );

    connection.release();

    res.json({ success: true, message: 'Report submitted successfully' });
  } catch (error) {
    connection.release();
    console.error('Create report error:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
};

// Get reports (admin only)
export const getReports = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { status = 'pending', targetType, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT 
        r.*,
        reporter.username as reporter_username, reporter.name as reporter_name,
        reviewer.username as reviewer_username, reviewer.name as reviewer_name
      FROM reports r
      JOIN users reporter ON r.reporter_id = reporter.id
      LEFT JOIN users reviewer ON r.reviewed_by = reviewer.id
      WHERE 1=1
    `;

    const params = [];

    if (status !== 'all') {
      query += ' AND r.status = ?';
      params.push(status);
    }

    if (targetType) {
      query += ' AND r.target_type = ?';
      params.push(targetType);
    }

    query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [reports] = await connection.query(query, params);

    connection.release();

    res.json({ success: true, data: reports });
  } catch (error) {
    connection.release();
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to get reports' });
  }
};

// Review report (admin only)
export const reviewReport = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { reportId } = req.params;
    const { action, notes } = req.body; // dismiss, remove_content, ban_user
    const userId = req.user.id;

    const validActions = ['dismiss', 'remove_content', 'ban_user'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const [reports] = await connection.query(
      'SELECT * FROM reports WHERE id = ?',
      [reportId]
    );

    if (reports.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = reports[0];

    await connection.beginTransaction();

    // Update report status
    await connection.query(
      'UPDATE reports SET status = ?, reviewed_by = ?, reviewed_at = NOW(), action_taken = ?, notes = ? WHERE id = ?',
      [action === 'dismiss' ? 'dismissed' : 'resolved', userId, action, notes || null, reportId]
    );

    // Take action based on report type
    if (action === 'remove_content') {
      if (report.target_type === 'post') {
        await connection.query(
          'UPDATE posts SET is_active = FALSE WHERE id = ?',
          [report.target_id]
        );
      } else if (report.target_type === 'comment') {
        await connection.query(
          'UPDATE comments SET is_active = FALSE WHERE id = ?',
          [report.target_id]
        );
      }
    } else if (action === 'ban_user') {
      let targetUserId;
      if (report.target_type === 'user') {
        targetUserId = report.target_id;
      } else if (report.target_type === 'post') {
        const [post] = await connection.query(
          'SELECT user_id FROM posts WHERE id = ?',
          [report.target_id]
        );
        targetUserId = post[0]?.user_id;
      } else if (report.target_type === 'comment') {
        const [comment] = await connection.query(
          'SELECT user_id FROM comments WHERE id = ?',
          [report.target_id]
        );
        targetUserId = comment[0]?.user_id;
      }

      if (targetUserId) {
        await connection.query(
          'INSERT INTO user_bans (user_id, banned_by, reason) VALUES (?, ?, ?)',
          [targetUserId, userId, notes || 'Violated community guidelines']
        );
      }
    }

    // Log moderation action
    await connection.query(
      'INSERT INTO moderation_logs (moderator_id, action, target_type, target_id, reason) VALUES (?, ?, ?, ?, ?)',
      [userId, action, report.target_type, report.target_id, notes || 'Report review']
    );

    await connection.commit();
    connection.release();

    res.json({ success: true, message: 'Report reviewed successfully' });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Review report error:', error);
    res.status(500).json({ error: 'Failed to review report' });
  }
};

// Ban user (admin only)
export const banUser = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { userId } = req.params;
    const { reason, duration } = req.body; // duration in days, null for permanent
    const bannedBy = req.user.id;

    // Check if already banned
    const [existing] = await connection.query(
      'SELECT id FROM user_bans WHERE user_id = ? AND is_active = TRUE',
      [userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'User is already banned' });
    }

    let expiresAt = null;
    if (duration) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(duration));
    }

    await connection.query(
      'INSERT INTO user_bans (user_id, banned_by, reason, expires_at) VALUES (?, ?, ?, ?)',
      [userId, bannedBy, reason, expiresAt]
    );

    // Log action
    await connection.query(
      'INSERT INTO moderation_logs (moderator_id, action, target_type, target_id, reason) VALUES (?, ?, ?, ?, ?)',
      [bannedBy, 'ban_user', 'user', userId, reason]
    );

    connection.release();

    res.json({ success: true, message: 'User banned successfully' });
  } catch (error) {
    connection.release();
    console.error('Ban user error:', error);
    res.status(500).json({ error: 'Failed to ban user' });
  }
};

// Unban user (admin only)
export const unbanUser = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { userId } = req.params;
    const unbannedBy = req.user.id;

    await connection.query(
      'UPDATE user_bans SET is_active = FALSE WHERE user_id = ? AND is_active = TRUE',
      [userId]
    );

    // Log action
    await connection.query(
      'INSERT INTO moderation_logs (moderator_id, action, target_type, target_id, reason) VALUES (?, ?, ?, ?, ?)',
      [unbannedBy, 'unban_user', 'user', userId, 'User unbanned']
    );

    connection.release();

    res.json({ success: true, message: 'User unbanned successfully' });
  } catch (error) {
    connection.release();
    console.error('Unban user error:', error);
    res.status(500).json({ error: 'Failed to unban user' });
  }
};

// Get moderation logs (admin only)
export const getModerationLogs = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [logs] = await connection.query(
      `SELECT 
        ml.*,
        u.username as moderator_username, u.name as moderator_name
       FROM moderation_logs ml
       JOIN users u ON ml.moderator_id = u.id
       ORDER BY ml.created_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), offset]
    );

    connection.release();

    res.json({ success: true, data: logs });
  } catch (error) {
    connection.release();
    console.error('Get moderation logs error:', error);
    res.status(500).json({ error: 'Failed to get logs' });
  }
};
