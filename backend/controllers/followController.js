import pool from '../config/database.js';

// Follow a user
export const followUser = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const followerId = req.user.userId;
        const { userId } = req.params;

        // Validate
        if (parseInt(userId) === followerId) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }

        // Check if user exists
        const [users] = await connection.query('SELECT id FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if already following
        const [existing] = await connection.query(
            'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
            [followerId, userId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Already following this user' });
        }

        // Check if blocked
        const [blocked] = await connection.query(
            'SELECT id FROM blocked_users WHERE (user_id = ? AND blocked_user_id = ?) OR (user_id = ? AND blocked_user_id = ?)',
            [followerId, userId, userId, followerId]
        );

        if (blocked.length > 0) {
            return res.status(403).json({ error: 'Cannot follow this user' });
        }

        // Create follow relationship
        await connection.query(
            'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
            [followerId, userId]
        );

        // Create notification
        await connection.query(
            `INSERT INTO notifications (user_id, type, notification_type, content, from_user_id, data) 
             VALUES (?, 'follow', 'follow', 'started following you', ?, JSON_OBJECT('action', 'follow'))`,
            [userId, followerId]
        );

        res.json({ message: 'Successfully followed user' });
    } catch (error) {
        console.error('Follow user error:', error);
        res.status(500).json({ error: 'Failed to follow user' });
    } finally {
        connection.release();
    }
};

// Unfollow a user
export const unfollowUser = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const followerId = req.user.userId;
        const { userId } = req.params;

        const [result] = await connection.query(
            'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
            [followerId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Not following this user' });
        }

        res.json({ message: 'Successfully unfollowed user' });
    } catch (error) {
        console.error('Unfollow user error:', error);
        res.status(500).json({ error: 'Failed to unfollow user' });
    } finally {
        connection.release();
    }
};

// Get user's followers
export const getFollowers = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { userId } = req.params;
        const currentUserId = req.user.userId;

        const [followers] = await connection.query(
            `SELECT 
                u.id, u.username, u.name, u.avatar, u.bio, u.verified,
                f.created_at as followed_at,
                EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) as is_following,
                EXISTS(SELECT 1 FROM blocked_users WHERE user_id = ? AND blocked_user_id = u.id) as is_blocked
            FROM follows f
            JOIN users u ON f.follower_id = u.id
            WHERE f.following_id = ?
            ORDER BY f.created_at DESC`,
            [currentUserId, currentUserId, userId]
        );

        res.json({ followers });
    } catch (error) {
        console.error('Get followers error:', error);
        res.status(500).json({ error: 'Failed to get followers' });
    } finally {
        connection.release();
    }
};

// Get users the user is following
export const getFollowing = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { userId } = req.params;
        const currentUserId = req.user.userId;

        const [following] = await connection.query(
            `SELECT 
                u.id, u.username, u.name, u.avatar, u.bio, u.verified,
                f.created_at as followed_at,
                EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) as is_following,
                EXISTS(SELECT 1 FROM blocked_users WHERE user_id = ? AND blocked_user_id = u.id) as is_blocked
            FROM follows f
            JOIN users u ON f.following_id = u.id
            WHERE f.follower_id = ?
            ORDER BY f.created_at DESC`,
            [currentUserId, currentUserId, userId]
        );

        res.json({ following });
    } catch (error) {
        console.error('Get following error:', error);
        res.status(500).json({ error: 'Failed to get following' });
    } finally {
        connection.release();
    }
};

// Block a user
export const blockUser = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const userId = req.user.userId;
        const { targetUserId } = req.params;
        const { reason } = req.body;

        // Validate
        if (parseInt(targetUserId) === userId) {
            return res.status(400).json({ error: 'Cannot block yourself' });
        }

        // Check if already blocked
        const [existing] = await connection.query(
            'SELECT id FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?',
            [userId, targetUserId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'User already blocked' });
        }

        await connection.beginTransaction();

        // Block the user
        await connection.query(
            'INSERT INTO blocked_users (user_id, blocked_user_id, reason) VALUES (?, ?, ?)',
            [userId, targetUserId, reason || null]
        );

        // Remove follow relationships
        await connection.query(
            'DELETE FROM follows WHERE (follower_id = ? AND following_id = ?) OR (follower_id = ? AND following_id = ?)',
            [userId, targetUserId, targetUserId, userId]
        );

        await connection.commit();

        res.json({ message: 'User blocked successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Block user error:', error);
        res.status(500).json({ error: 'Failed to block user' });
    } finally {
        connection.release();
    }
};

// Unblock a user
export const unblockUser = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const userId = req.user.userId;
        const { targetUserId } = req.params;

        const [result] = await connection.query(
            'DELETE FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?',
            [userId, targetUserId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User is not blocked' });
        }

        res.json({ message: 'User unblocked successfully' });
    } catch (error) {
        console.error('Unblock user error:', error);
        res.status(500).json({ error: 'Failed to unblock user' });
    } finally {
        connection.release();
    }
};

// Get blocked users
export const getBlockedUsers = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const userId = req.user.userId;

        const [blockedUsers] = await connection.query(
            `SELECT 
                u.id, u.username, u.name, u.avatar,
                b.reason, b.created_at as blocked_at
            FROM blocked_users b
            JOIN users u ON b.blocked_user_id = u.id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC`,
            [userId]
        );

        res.json({ blockedUsers });
    } catch (error) {
        console.error('Get blocked users error:', error);
        res.status(500).json({ error: 'Failed to get blocked users' });
    } finally {
        connection.release();
    }
};

// Get follow stats
export const getFollowStats = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { userId } = req.params;

        const [stats] = await connection.query(
            `SELECT 
                (SELECT COUNT(*) FROM follows WHERE following_id = ?) as followers_count,
                (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following_count`,
            [userId, userId]
        );

        res.json(stats[0]);
    } catch (error) {
        console.error('Get follow stats error:', error);
        res.status(500).json({ error: 'Failed to get follow stats' });
    } finally {
        connection.release();
    }
};

// Check if following
export const checkFollowing = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const followerId = req.user.userId;
        const { userId } = req.params;

        const [result] = await connection.query(
            'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
            [followerId, userId]
        );

        res.json({ isFollowing: result.length > 0 });
    } catch (error) {
        console.error('Check following error:', error);
        res.status(500).json({ error: 'Failed to check following status' });
    } finally {
        connection.release();
    }
};

// Get suggested users to follow
export const getSuggestedUsers = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const userId = req.user.userId;
        const limit = parseInt(req.query.limit) || 10;

        // Suggest users based on mutual followers and departments
        const [suggested] = await connection.query(
            `SELECT DISTINCT
                u.id, u.username, u.name, u.avatar, u.bio, u.verified,
                (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
                (
                    SELECT COUNT(*) 
                    FROM follows f1
                    WHERE f1.following_id = u.id
                    AND f1.follower_id IN (
                        SELECT following_id FROM follows WHERE follower_id = ?
                    )
                ) as mutual_followers
            FROM users u
            WHERE u.id != ?
            AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id = ?)
            AND u.id NOT IN (SELECT blocked_user_id FROM blocked_users WHERE user_id = ?)
            AND (
                u.id IN (
                    SELECT DISTINCT dm.user_id
                    FROM department_members dm
                    WHERE dm.department_id IN (
                        SELECT department_id FROM department_members WHERE user_id = ?
                    )
                )
                OR u.id IN (
                    SELECT DISTINCT follower_id
                    FROM follows
                    WHERE following_id IN (
                        SELECT following_id FROM follows WHERE follower_id = ?
                    )
                )
            )
            ORDER BY mutual_followers DESC, followers_count DESC
            LIMIT ?`,
            [userId, userId, userId, userId, userId, userId, limit]
        );

        res.json({ suggested });
    } catch (error) {
        console.error('Get suggested users error:', error);
        res.status(500).json({ error: 'Failed to get suggested users' });
    } finally {
        connection.release();
    }
};
