import db from '../config/database.js';

// Add moderator to department
export const addModerator = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { departmentId } = req.params;
    const { userId, permissions } = req.body;
    const currentUserId = req.user.id;

    // Verify current user is admin
    const [dept] = await connection.query(
      'SELECT created_by FROM departments WHERE id = ?',
      [departmentId]
    );

    if (dept.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    if (dept[0].created_by !== currentUserId) {
      return res.status(403).json({ error: 'Only department admin can add moderators' });
    }

    // Verify user is a member
    const [member] = await connection.query(
      'SELECT id FROM department_members WHERE department_id = ? AND user_id = ?',
      [departmentId, userId]
    );

    if (member.length === 0) {
      return res.status(400).json({ error: 'User must be a member to become moderator' });
    }

    // Check if already moderator
    const [existing] = await connection.query(
      'SELECT id FROM department_moderators WHERE department_id = ? AND user_id = ?',
      [departmentId, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'User is already a moderator' });
    }

    const defaultPermissions = {
      canApprovePost: true,
      canDeletePost: true,
      canDeleteComment: true,
      canBanUser: false,
      canCreateEvent: true,
      canEditRules: false
    };

    await connection.query(
      'INSERT INTO department_moderators (department_id, user_id, permissions, assigned_by) VALUES (?, ?, ?, ?)',
      [departmentId, userId, JSON.stringify(permissions || defaultPermissions), currentUserId]
    );

    connection.release();

    res.json({ success: true, message: 'Moderator added successfully' });
  } catch (error) {
    connection.release();
    console.error('Add moderator error:', error);
    res.status(500).json({ error: 'Failed to add moderator' });
  }
};

// Remove moderator
export const removeModerator = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { departmentId, moderatorId } = req.params;
    const currentUserId = req.user.id;

    // Verify current user is admin
    const [dept] = await connection.query(
      'SELECT created_by FROM departments WHERE id = ?',
      [departmentId]
    );

    if (dept.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    if (dept[0].created_by !== currentUserId) {
      return res.status(403).json({ error: 'Only department admin can remove moderators' });
    }

    await connection.query(
      'DELETE FROM department_moderators WHERE department_id = ? AND user_id = ?',
      [departmentId, moderatorId]
    );

    connection.release();

    res.json({ success: true, message: 'Moderator removed successfully' });
  } catch (error) {
    connection.release();
    console.error('Remove moderator error:', error);
    res.status(500).json({ error: 'Failed to remove moderator' });
  }
};

// Get department moderators
export const getModerators = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { departmentId } = req.params;

    const [moderators] = await connection.query(
      `SELECT 
        dm.*,
        u.id as user_id, u.username, u.name, u.avatar,
        assigned_by_user.username as assigned_by_username,
        assigned_by_user.name as assigned_by_name
       FROM department_moderators dm
       JOIN users u ON dm.user_id = u.id
       LEFT JOIN users assigned_by_user ON dm.assigned_by = assigned_by_user.id
       WHERE dm.department_id = ?
       ORDER BY dm.assigned_at DESC`,
      [departmentId]
    );

    connection.release();

    res.json({ success: true, data: moderators });
  } catch (error) {
    connection.release();
    console.error('Get moderators error:', error);
    res.status(500).json({ error: 'Failed to get moderators' });
  }
};

// Update moderator permissions
export const updateModeratorPermissions = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { departmentId, moderatorId } = req.params;
    const { permissions } = req.body;
    const currentUserId = req.user.id;

    // Verify current user is admin
    const [dept] = await connection.query(
      'SELECT created_by FROM departments WHERE id = ?',
      [departmentId]
    );

    if (dept.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    if (dept[0].created_by !== currentUserId) {
      return res.status(403).json({ error: 'Only department admin can update permissions' });
    }

    await connection.query(
      'UPDATE department_moderators SET permissions = ? WHERE department_id = ? AND user_id = ?',
      [JSON.stringify(permissions), departmentId, moderatorId]
    );

    connection.release();

    res.json({ success: true, message: 'Permissions updated successfully' });
  } catch (error) {
    connection.release();
    console.error('Update permissions error:', error);
    res.status(500).json({ error: 'Failed to update permissions' });
  }
};

// Create event
export const createEvent = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { departmentId } = req.params;
    const {
      title,
      description,
      eventType,
      location,
      startTime,
      endTime,
      maxAttendees
    } = req.body;
    const userId = req.user.id;

    // Verify user is admin or moderator with permission
    const [dept] = await connection.query(
      'SELECT created_by FROM departments WHERE id = ?',
      [departmentId]
    );

    if (dept.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const isAdmin = dept[0].created_by === userId;

    if (!isAdmin) {
      const [mod] = await connection.query(
        'SELECT permissions FROM department_moderators WHERE department_id = ? AND user_id = ?',
        [departmentId, userId]
      );

      if (mod.length === 0) {
        return res.status(403).json({ error: 'Only admins and moderators can create events' });
      }

      const permissions = JSON.parse(mod[0].permissions);
      if (!permissions.canCreateEvent) {
        return res.status(403).json({ error: 'You do not have permission to create events' });
      }
    }

    const [result] = await connection.query(
      `INSERT INTO events 
       (department_id, created_by, title, description, event_type, location, start_time, end_time, max_attendees) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [departmentId, userId, title, description, eventType, location, startTime, endTime, maxAttendees || null]
    );

    connection.release();

    res.json({ success: true, message: 'Event created successfully', data: { eventId: result.insertId } });
  } catch (error) {
    connection.release();
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
};

// Get department events
export const getEvents = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { departmentId } = req.params;
    const { upcoming = 'true' } = req.query;

    let query = `
      SELECT 
        e.*,
        u.username as creator_username, u.name as creator_name, u.avatar as creator_avatar,
        (SELECT COUNT(*) FROM event_attendees WHERE event_id = e.id AND status = 'going') as going_count,
        (SELECT COUNT(*) FROM event_attendees WHERE event_id = e.id AND status = 'maybe') as maybe_count
      FROM events e
      JOIN users u ON e.created_by = u.id
      WHERE e.department_id = ?
    `;

    const params = [departmentId];

    if (upcoming === 'true') {
      query += ' AND e.start_time > NOW() AND e.is_active = TRUE';
    }

    query += ' ORDER BY e.start_time ASC';

    const [events] = await connection.query(query, params);

    connection.release();

    res.json({ success: true, data: events });
  } catch (error) {
    connection.release();
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to get events' });
  }
};

// RSVP to event
export const rsvpEvent = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { eventId } = req.params;
    const { status } = req.body; // going, maybe, not_going
    const userId = req.user.id;

    const validStatuses = ['going', 'maybe', 'not_going'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid RSVP status' });
    }

    // Check if event exists and is active
    const [events] = await connection.query(
      'SELECT * FROM events WHERE id = ? AND is_active = TRUE',
      [eventId]
    );

    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found or inactive' });
    }

    const event = events[0];

    // Check max attendees
    if (status === 'going' && event.max_attendees) {
      const [count] = await connection.query(
        'SELECT COUNT(*) as count FROM event_attendees WHERE event_id = ? AND status = "going"',
        [eventId]
      );

      if (count[0].count >= event.max_attendees) {
        return res.status(400).json({ error: 'Event is full' });
      }
    }

    // Check if already RSVP'd
    const [existing] = await connection.query(
      'SELECT id FROM event_attendees WHERE event_id = ? AND user_id = ?',
      [eventId, userId]
    );

    if (existing.length > 0) {
      if (status === 'not_going') {
        // Remove RSVP
        await connection.query(
          'DELETE FROM event_attendees WHERE event_id = ? AND user_id = ?',
          [eventId, userId]
        );
      } else {
        // Update RSVP
        await connection.query(
          'UPDATE event_attendees SET status = ? WHERE event_id = ? AND user_id = ?',
          [status, eventId, userId]
        );
      }
    } else {
      if (status !== 'not_going') {
        // Create RSVP
        await connection.query(
          'INSERT INTO event_attendees (event_id, user_id, status) VALUES (?, ?, ?)',
          [eventId, userId, status]
        );
      }
    }

    connection.release();

    res.json({ success: true, message: 'RSVP updated successfully' });
  } catch (error) {
    connection.release();
    console.error('RSVP event error:', error);
    res.status(500).json({ error: 'Failed to update RSVP' });
  }
};

// Get event attendees
export const getEventAttendees = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { eventId } = req.params;

    const [attendees] = await connection.query(
      `SELECT 
        ea.*,
        u.id as user_id, u.username, u.name, u.avatar
       FROM event_attendees ea
       JOIN users u ON ea.user_id = u.id
       WHERE ea.event_id = ?
       ORDER BY ea.registered_at DESC`,
      [eventId]
    );

    connection.release();

    res.json({ success: true, data: attendees });
  } catch (error) {
    connection.release();
    console.error('Get attendees error:', error);
    res.status(500).json({ error: 'Failed to get attendees' });
  }
};

// Submit post for approval (if department requires approval)
export const submitPostForApproval = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { postId, departmentId } = req.body;
    const userId = req.user.id;

    // Verify post exists and belongs to user
    const [posts] = await connection.query(
      'SELECT * FROM posts WHERE id = ? AND user_id = ? AND department_id = ?',
      [postId, userId, departmentId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if already submitted
    const [existing] = await connection.query(
      'SELECT id FROM pending_posts WHERE post_id = ?',
      [postId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Post already submitted for approval' });
    }

    await connection.query(
      'INSERT INTO pending_posts (post_id, department_id, submitted_by) VALUES (?, ?, ?)',
      [postId, departmentId, userId]
    );

    connection.release();

    res.json({ success: true, message: 'Post submitted for approval' });
  } catch (error) {
    connection.release();
    console.error('Submit post error:', error);
    res.status(500).json({ error: 'Failed to submit post' });
  }
};

// Get pending posts (for moderators/admins)
export const getPendingPosts = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { departmentId } = req.params;
    const userId = req.user.id;

    // Verify user is admin or moderator
    const [dept] = await connection.query(
      'SELECT created_by FROM departments WHERE id = ?',
      [departmentId]
    );

    if (dept.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const isAdmin = dept[0].created_by === userId;

    if (!isAdmin) {
      const [mod] = await connection.query(
        'SELECT permissions FROM department_moderators WHERE department_id = ? AND user_id = ?',
        [departmentId, userId]
      );

      if (mod.length === 0) {
        return res.status(403).json({ error: 'Only admins and moderators can view pending posts' });
      }

      const permissions = JSON.parse(mod[0].permissions);
      if (!permissions.canApprovePost) {
        return res.status(403).json({ error: 'You do not have permission to approve posts' });
      }
    }

    const [pending] = await connection.query(
      `SELECT 
        pp.*,
        p.content, p.media_url, p.created_at as post_created_at,
        u.username, u.name, u.avatar
       FROM pending_posts pp
       JOIN posts p ON pp.post_id = p.id
       JOIN users u ON pp.submitted_by = u.id
       WHERE pp.department_id = ? AND pp.status = 'pending'
       ORDER BY pp.created_at DESC`,
      [departmentId]
    );

    connection.release();

    res.json({ success: true, data: pending });
  } catch (error) {
    connection.release();
    console.error('Get pending posts error:', error);
    res.status(500).json({ error: 'Failed to get pending posts' });
  }
};

// Review pending post
export const reviewPendingPost = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { postId } = req.params;
    const { action, rejectionReason } = req.body; // approve or reject
    const userId = req.user.id;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Get pending post
    const [pending] = await connection.query(
      'SELECT * FROM pending_posts WHERE post_id = ? AND status = "pending"',
      [postId]
    );

    if (pending.length === 0) {
      return res.status(404).json({ error: 'Pending post not found' });
    }

    const departmentId = pending[0].department_id;

    // Verify user is admin or moderator with permission
    const [dept] = await connection.query(
      'SELECT created_by FROM departments WHERE id = ?',
      [departmentId]
    );

    const isAdmin = dept[0].created_by === userId;

    if (!isAdmin) {
      const [mod] = await connection.query(
        'SELECT permissions FROM department_moderators WHERE department_id = ? AND user_id = ?',
        [departmentId, userId]
      );

      if (mod.length === 0) {
        return res.status(403).json({ error: 'Only admins and moderators can review posts' });
      }

      const permissions = JSON.parse(mod[0].permissions);
      if (!permissions.canApprovePost) {
        return res.status(403).json({ error: 'You do not have permission to approve posts' });
      }
    }

    await connection.beginTransaction();

    if (action === 'approve') {
      // Update pending post status
      await connection.query(
        'UPDATE pending_posts SET status = "approved", reviewed_by = ?, reviewed_at = NOW() WHERE post_id = ?',
        [userId, postId]
      );

      // Make post visible
      await connection.query(
        'UPDATE posts SET is_active = TRUE WHERE id = ?',
        [postId]
      );
    } else {
      // Update pending post status
      await connection.query(
        'UPDATE pending_posts SET status = "rejected", reviewed_by = ?, reviewed_at = NOW(), rejection_reason = ? WHERE post_id = ?',
        [userId, rejectionReason || 'No reason provided', postId]
      );

      // Optionally delete the post or keep it inactive
      await connection.query(
        'UPDATE posts SET is_active = FALSE WHERE id = ?',
        [postId]
      );
    }

    await connection.commit();
    connection.release();

    res.json({ success: true, message: `Post ${action}d successfully` });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Review post error:', error);
    res.status(500).json({ error: 'Failed to review post' });
  }
};

// Update department settings
export const updateDepartmentSettings = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { departmentId } = req.params;
    const { coverImage, rules, requireApproval } = req.body;
    const userId = req.user.id;

    // Verify user is admin
    const [dept] = await connection.query(
      'SELECT created_by FROM departments WHERE id = ?',
      [departmentId]
    );

    if (dept.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    if (dept[0].created_by !== userId) {
      return res.status(403).json({ error: 'Only department admin can update settings' });
    }

    const updates = [];
    const params = [];

    if (coverImage !== undefined) {
      updates.push('cover_image = ?');
      params.push(coverImage);
    }

    if (rules !== undefined) {
      updates.push('rules = ?');
      params.push(rules);
    }

    if (requireApproval !== undefined) {
      updates.push('require_approval = ?');
      params.push(requireApproval);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    params.push(departmentId);

    await connection.query(
      `UPDATE departments SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    connection.release();

    res.json({ success: true, message: 'Department settings updated successfully' });
  } catch (error) {
    connection.release();
    console.error('Update department settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};
