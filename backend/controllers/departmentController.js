import db from '../config/database.js';

// Create a new department
export const createDepartment = async (req, res) => {
  try {
    const { name, type, description, location, country, state, city } = req.body;
    const userId = req.user.id;

    // Insert department
    const [result] = await db.query(
      `INSERT INTO departments (name, type, description, location, country, state, city, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, type, description || null, location || null, country || null, state || null, city || null, userId]
    );

    const departmentId = result.insertId;

    // Auto-join creator as admin
    await db.query(
      `INSERT INTO department_members (department_id, user_id, role) VALUES (?, ?, 'admin')`,
      [departmentId, userId]
    );

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: {
        departmentId
      }
    });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create department',
      error: error.message
    });
  }
};

// Get all departments with filters
export const getDepartments = async (req, res) => {
  try {
    const { type, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = ['d.is_active = TRUE'];
    let queryParams = [];

    if (type) {
      whereConditions.push('d.type = ?');
      queryParams.push(type);
    }

    if (search) {
      whereConditions.push('d.name LIKE ?');
      queryParams.push(`%${search}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get departments with statistics
    const [departments] = await db.query(
      `SELECT 
        d.*,
        u.name as creator_name,
        u.username as creator_username,
        ds.members_count,
        ds.posts_count
       FROM departments d
       INNER JOIN users u ON d.created_by = u.id
       LEFT JOIN department_statistics ds ON d.id = ds.department_id
       WHERE ${whereClause}
       ORDER BY d.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), offset]
    );

    // Check if current user is a member (if authenticated)
    if (req.user && departments.length > 0) {
      const departmentIds = departments.map(d => d.id);
      const placeholders = departmentIds.map(() => '?').join(',');
      const [memberships] = await db.query(
        `SELECT department_id FROM department_members WHERE user_id = ? AND department_id IN (${placeholders})`,
        [req.user.id, ...departmentIds]
      );

      const memberDeptIds = new Set(memberships.map(m => m.department_id));
      departments.forEach(dept => {
        dept.is_member = memberDeptIds.has(dept.id);
        dept.member_count = dept.members_count || 0;
        dept.post_count = dept.posts_count || 0;
        // Clean up alternative names
        delete dept.members_count;
        delete dept.posts_count;
      });
    } else {
      // For non-authenticated users, set is_member to false
      departments.forEach(dept => {
        dept.is_member = false;
        dept.member_count = dept.members_count || 0;
        dept.post_count = dept.posts_count || 0;
        delete dept.members_count;
        delete dept.posts_count;
      });
    }

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM departments d WHERE ${whereClause}`,
      queryParams
    );

    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        departments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments',
      error: error.message
    });
  }
};

// Get single department
export const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [departments] = await db.query(
      `SELECT 
        d.*,
        u.name as creator_name,
        u.username as creator_username,
        ds.members_count,
        ds.posts_count
       FROM departments d
       INNER JOIN users u ON d.created_by = u.id
       LEFT JOIN department_statistics ds ON d.id = ds.department_id
       WHERE d.id = ? AND d.is_active = TRUE`,
      [id]
    );

    if (departments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const department = departments[0];

    // Check if current user is a member
    if (req.user) {
      const [membership] = await db.query(
        `SELECT role FROM department_members WHERE user_id = ? AND department_id = ?`,
        [req.user.id, id]
      );

      department.isJoined = membership.length > 0;
      department.userRole = membership.length > 0 ? membership[0].role : null;
    }

    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department',
      error: error.message
    });
  }
};

// Join department
export const joinDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if department exists and get creator
    const [departments] = await db.query(
      'SELECT id, created_by FROM departments WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (departments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Prevent joining own department (creator is auto-member as admin)
    if (departments[0].created_by === userId) {
      return res.status(400).json({
        success: false,
        message: 'You are the creator of this department'
      });
    }

    // Check if already a member
    const [existing] = await db.query(
      'SELECT id FROM department_members WHERE user_id = ? AND department_id = ?',
      [userId, id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Already a member of this department'
      });
    }

    // Join department
    await db.query(
      `INSERT INTO department_members (department_id, user_id, role) VALUES (?, ?, 'member')`,
      [id, userId]
    );

    res.json({
      success: true,
      message: 'Joined department successfully'
    });
  } catch (error) {
    console.error('Join department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join department',
      error: error.message
    });
  }
};

// Leave department
export const leaveDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if member
    const [membership] = await db.query(
      'SELECT role FROM department_members WHERE user_id = ? AND department_id = ?',
      [userId, id]
    );

    if (membership.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Not a member of this department'
      });
    }

    // Don't allow admin to leave if they're the only admin
    if (membership[0].role === 'admin') {
      const [adminCount] = await db.query(
        `SELECT COUNT(*) as count FROM department_members WHERE department_id = ? AND role = 'admin'`,
        [id]
      );

      if (adminCount[0].count <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot leave - you are the only admin. Transfer ownership first.'
        });
      }
    }

    // Leave department
    await db.query(
      'DELETE FROM department_members WHERE user_id = ? AND department_id = ?',
      [userId, id]
    );

    res.json({
      success: true,
      message: 'Left department successfully'
    });
  } catch (error) {
    console.error('Leave department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave department',
      error: error.message
    });
  }
};

// Get department members
export const getDepartmentMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const [members] = await db.query(
      `SELECT 
        dm.id,
        dm.role,
        dm.joined_at,
        u.id as user_id,
        u.name,
        u.username,
        u.profile_avatar
       FROM department_members dm
       INNER JOIN users u ON dm.user_id = u.id
       WHERE dm.department_id = ?
       ORDER BY dm.joined_at DESC
       LIMIT ? OFFSET ?`,
      [id, parseInt(limit), offset]
    );

    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM department_members WHERE department_id = ?',
      [id]
    );

    res.json({
      success: true,
      data: {
        members,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get department members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department members',
      error: error.message
    });
  }
};

// Get department posts
export const getDepartmentPosts = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Check if user is member or creator (for access control)
    let hasAccess = false;
    if (req.user) {
      const [membership] = await db.query(
        `SELECT dm.id FROM department_members dm
         WHERE dm.user_id = ? AND dm.department_id = ?
         UNION
         SELECT d.id FROM departments d WHERE d.created_by = ? AND d.id = ?`,
        [req.user.id, id, req.user.id, id]
      );
      hasAccess = membership.length > 0;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of this department to view posts'
      });
    }

    // Get posts from this department
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
       WHERE p.department_id = ? AND p.is_active = TRUE
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [id, parseInt(limit), offset]
    );

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM posts 
       WHERE department_id = ? AND is_active = TRUE`,
      [id]
    );

    // Check if current user liked/shared posts
    if (req.user && posts.length > 0) {
      const postIds = posts.map(p => p.id);
      const [userLikes] = await db.query(
        `SELECT post_id FROM post_likes WHERE user_id = ? AND post_id IN (?)`,
        [req.user.id, postIds]
      );
      const [userShares] = await db.query(
        `SELECT post_id FROM post_shares WHERE user_id = ? AND post_id IN (?)`,
        [req.user.id, postIds]
      );

      const likedIds = new Set(userLikes.map(l => l.post_id));
      const sharedIds = new Set(userShares.map(s => s.post_id));

      posts.forEach(post => {
        post.isLikedByUser = likedIds.has(post.id);
        post.isSharedByUser = sharedIds.has(post.id);
      });
    }

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get department posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department posts',
      error: error.message
    });
  }
};

// Update department
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, location } = req.body;
    const userId = req.user.id;

    // Check if user is admin of department
    const [membership] = await db.query(
      'SELECT role FROM department_members WHERE user_id = ? AND department_id = ?',
      [userId, id]
    );

    if (membership.length === 0 || membership[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized - admin access required'
      });
    }

    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (location !== undefined) {
      updates.push('location = ?');
      values.push(location);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(id);

    await db.query(
      `UPDATE departments SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({
      success: true,
      message: 'Department updated successfully'
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update department',
      error: error.message
    });
  }
};

// Delete department
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is admin of department
    const [membership] = await db.query(
      'SELECT role FROM department_members WHERE user_id = ? AND department_id = ?',
      [userId, id]
    );

    if (membership.length === 0 || membership[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized - admin access required'
      });
    }

    // Soft delete
    await db.query(
      'UPDATE departments SET is_active = FALSE WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete department',
      error: error.message
    });
  }
};
