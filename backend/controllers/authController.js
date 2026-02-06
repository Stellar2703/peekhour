import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';
import path from 'path';

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username,
      email: user.email 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Register new user
export const register = async (req, res) => {
  try {
    const { name, username, email, mobileNumber, password } = req.body;
    
    // Check if user already exists
    const [existingUser] = await db.query(
      'SELECT id FROM users WHERE username = ? OR email = ? OR mobile_number = ?',
      [username, email, mobileNumber]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this username, email, or mobile number already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Get face image path if uploaded (optional for testing)
    const faceImagePath = req.file ? `/uploads/faces/${req.file.filename}` : null;

    // Generate avatar initials
    const avatar = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

    // Insert user (face_image_path is optional)
    const [result] = await db.query(
      `INSERT INTO users (name, username, email, mobile_number, password_hash, face_image_path, profile_avatar) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, username, email, mobileNumber, passwordHash, faceImagePath, avatar]
    );

    const userId = result.insertId;

    // Generate token
    const token = generateToken({ id: userId, username, email });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: userId,
          name,
          username,
          email,
          avatar
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const [users] = await db.query(
      'SELECT id, name, username, email, password_hash, profile_avatar, is_active FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is disabled'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          avatar: user.profile_avatar
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT id, name, username, email, mobile_number, profile_avatar, face_image_path, created_at 
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { name, email, mobileNumber } = req.body;
    const userId = req.user.id;

    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    if (mobileNumber) {
      updates.push('mobile_number = ?');
      values.push(mobileNumber);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(userId);

    await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// Logout (client-side token removal, server can implement token blacklist)
export const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
};
