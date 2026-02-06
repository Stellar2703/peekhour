import db from '../config/database.js';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

// Enable 2FA
export const enable2FA = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const userId = req.user.id;

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `PeekHour (${req.user.username})`,
      length: 32,
    });

    // Store secret temporarily (will be verified before fully enabling)
    await connection.query(
      'INSERT INTO two_factor_auth (user_id, secret, is_enabled) VALUES (?, ?, FALSE) ON DUPLICATE KEY UPDATE secret = ?, is_enabled = FALSE',
      [userId, secret.base32, secret.base32]
    );

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    connection.release();

    res.json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode,
      },
    });
  } catch (error) {
    connection.release();
    console.error('Enable 2FA error:', error);
    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
};

// Verify and activate 2FA
export const verify2FA = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { token } = req.body;
    const userId = req.user.id;

    const [auth] = await connection.query(
      'SELECT secret FROM two_factor_auth WHERE user_id = ?',
      [userId]
    );

    if (auth.length === 0) {
      return res.status(404).json({ error: '2FA not initialized' });
    }

    const verified = speakeasy.totp.verify({
      secret: auth[0].secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    // Enable 2FA
    await connection.query(
      'UPDATE two_factor_auth SET is_enabled = TRUE WHERE user_id = ?',
      [userId]
    );

    connection.release();

    res.json({ success: true, message: '2FA enabled successfully' });
  } catch (error) {
    connection.release();
    console.error('Verify 2FA error:', error);
    res.status(500).json({ error: 'Failed to verify 2FA' });
  }
};

// Disable 2FA
export const disable2FA = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { password } = req.body;
    const userId = req.user.id;

    // Verify password
    const [users] = await connection.query(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    const validPassword = await bcrypt.compare(password, users[0].password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    await connection.query(
      'DELETE FROM two_factor_auth WHERE user_id = ?',
      [userId]
    );

    connection.release();

    res.json({ success: true, message: '2FA disabled successfully' });
  } catch (error) {
    connection.release();
    console.error('Disable 2FA error:', error);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
};

// Get login history
export const getLoginHistory = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    const [history] = await connection.query(
      'SELECT * FROM login_history WHERE user_id = ? ORDER BY login_at DESC LIMIT ?',
      [userId, parseInt(limit)]
    );

    connection.release();

    res.json({ success: true, data: history });
  } catch (error) {
    connection.release();
    console.error('Get login history error:', error);
    res.status(500).json({ error: 'Failed to get login history' });
  }
};

// Get active sessions
export const getActiveSessions = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const userId = req.user.id;

    const [sessions] = await connection.query(
      'SELECT * FROM active_sessions WHERE user_id = ? AND is_valid = TRUE ORDER BY last_activity DESC',
      [userId]
    );

    connection.release();

    res.json({ success: true, data: sessions });
  } catch (error) {
    connection.release();
    console.error('Get active sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
};

// Terminate session
export const terminateSession = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    await connection.query(
      'UPDATE active_sessions SET is_valid = FALSE WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );

    connection.release();

    res.json({ success: true, message: 'Session terminated' });
  } catch (error) {
    connection.release();
    console.error('Terminate session error:', error);
    res.status(500).json({ error: 'Failed to terminate session' });
  }
};

// Get privacy settings
export const getPrivacySettings = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const userId = req.user.id;

    const [settings] = await connection.query(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [userId]
    );

    if (settings.length === 0) {
      // Create default settings
      const defaults = {
        profile_visibility: 'public',
        show_email: false,
        allow_messages_from: 'everyone',
        allow_tags: true,
        show_activity_status: true,
      };

      await connection.query(
        `INSERT INTO user_settings (user_id, profile_visibility, show_email, allow_messages_from, allow_tags, show_activity_status) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, defaults.profile_visibility, defaults.show_email, defaults.allow_messages_from, defaults.allow_tags, defaults.show_activity_status]
      );

      connection.release();
      return res.json({ success: true, data: defaults });
    }

    connection.release();

    res.json({ success: true, data: settings[0] });
  } catch (error) {
    connection.release();
    console.error('Get privacy settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
};

// Update privacy settings
export const updatePrivacySettings = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const userId = req.user.id;
    const settings = req.body;

    const updates = [];
    const params = [];

    const allowedFields = [
      'profile_visibility',
      'show_email',
      'allow_messages_from',
      'allow_tags',
      'show_activity_status',
    ];

    Object.keys(settings).forEach((key) => {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        params.push(settings[key]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid settings provided' });
    }

    params.push(userId);

    await connection.query(
      `UPDATE user_settings SET ${updates.join(', ')} WHERE user_id = ?`,
      params
    );

    connection.release();

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    connection.release();
    console.error('Update privacy settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};
