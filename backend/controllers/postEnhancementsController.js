import db from '../config/database.js';

// Helper function to extract hashtags from content
function extractHashtags(content) {
  const hashtagRegex = /#(\w+)/g;
  const hashtags = [];
  let match;
  
  while ((match = hashtagRegex.exec(content)) !== null) {
    hashtags.push(match[1].toLowerCase());
  }
  
  return [...new Set(hashtags)]; // Remove duplicates
}

// Helper function to extract mentions from content
function extractMentions(content) {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1].toLowerCase());
  }
  
  return [...new Set(mentions)]; // Remove duplicates
}

// Save hashtags for a post
async function saveHashtags(connection, postId, hashtags) {
  if (hashtags.length === 0) return;

  for (const tag of hashtags) {
    // Insert or update hashtag
    await connection.query(
      `INSERT INTO hashtags (name, usage_count) 
       VALUES (?, 1)
       ON DUPLICATE KEY UPDATE usage_count = usage_count + 1`,
      [tag]
    );

    // Get hashtag ID
    const [hashtagResult] = await connection.query(
      'SELECT id FROM hashtags WHERE name = ?',
      [tag]
    );

    if (hashtagResult.length > 0) {
      // Link post to hashtag
      await connection.query(
        `INSERT IGNORE INTO post_hashtags (post_id, hashtag_id) VALUES (?, ?)`,
        [postId, hashtagResult[0].id]
      );
    }
  }
}

// Save mentions for a post
async function saveMentions(connection, postId, mentions, mentionedByUserId) {
  if (mentions.length === 0) return;

  for (const username of mentions) {
    // Find user by username
    const [users] = await connection.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (users.length > 0) {
      const mentionedUserId = users[0].id;

      // Save mention
      await connection.query(
        `INSERT INTO mentions (post_id, mentioned_user_id, mentioned_by_user_id) 
         VALUES (?, ?, ?)`,
        [postId, mentionedUserId, mentionedByUserId]
      );

      // Create notification
      await connection.query(
        `INSERT INTO notifications (user_id, type, notification_type, content, post_id, from_user_id, data)
         VALUES (?, 'mention', 'mention', 'mentioned you in a post', ?, ?, JSON_OBJECT('action', 'mention'))`,
        [mentionedUserId, postId, mentionedByUserId]
      );
    }
  }
}

// Edit a post
export const editPost = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    await connection.beginTransaction();

    // Check ownership
    const [posts] = await connection.query(
      'SELECT * FROM posts WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (posts.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Post not found or unauthorized' });
    }

    const oldPost = posts[0];

    // Save edit history
    await connection.query(
      'INSERT INTO post_edits (post_id, previous_content, edited_by) VALUES (?, ?, ?)',
      [id, oldPost.content, userId]
    );

    // Update post
    await connection.query(
      'UPDATE posts SET content = ?, edited_at = NOW() WHERE id = ?',
      [content, id]
    );

    // Clear old hashtags
    await connection.query('DELETE FROM post_hashtags WHERE post_id = ?', [id]);
    await connection.query('DELETE FROM mentions WHERE post_id = ?', [id]);

    // Extract and save new hashtags and mentions
    const hashtags = extractHashtags(content);
    const mentions = extractMentions(content);

    await saveHashtags(connection, id, hashtags);
    await saveMentions(connection, id, mentions, userId);

    await connection.commit();

    res.json({ message: 'Post updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Edit post error:', error);
    res.status(500).json({ error: 'Failed to edit post' });
  } finally {
    connection.release();
  }
};

// Delete a post
export const deletePost = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check ownership
    const [posts] = await connection.query(
      'SELECT * FROM posts WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found or unauthorized' });
    }

    await connection.query('DELETE FROM posts WHERE id = ?', [id]);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  } finally {
    connection.release();
  }
};

// Save/bookmark a post
export const toggleSavePost = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { collectionName = 'Saved' } = req.body;

    // Check if already saved
    const [saved] = await connection.query(
      'SELECT id FROM saved_posts WHERE user_id = ? AND post_id = ?',
      [userId, id]
    );

    if (saved.length > 0) {
      // Unsave
      await connection.query(
        'DELETE FROM saved_posts WHERE user_id = ? AND post_id = ?',
        [userId, id]
      );

      res.json({ message: 'Post unsaved', saved: false });
    } else {
      // Save
      await connection.query(
        'INSERT INTO saved_posts (user_id, post_id, collection_name) VALUES (?, ?, ?)',
        [userId, id, collectionName]
      );

      res.json({ message: 'Post saved', saved: true });
    }
  } catch (error) {
    console.error('Toggle save post error:', error);
    res.status(500).json({ error: 'Failed to save post' });
  } finally {
    connection.release();
  }
};

// Get saved posts
export const getSavedPosts = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const userId = req.user.id;
    const { collection } = req.query;

    let query = `
      SELECT 
        p.*,
        u.username, u.name, u.avatar,
        sp.collection_name, sp.created_at as saved_at,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
        (SELECT COUNT(*) FROM post_shares WHERE post_id = p.id) as shares_count,
        EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) as is_liked,
        EXISTS(SELECT 1 FROM saved_posts WHERE post_id = p.id AND user_id = ?) as is_saved
      FROM saved_posts sp
      JOIN posts p ON sp.post_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE sp.user_id = ?
    `;

    const params = [userId, userId, userId];

    if (collection) {
      query += ' AND sp.collection_name = ?';
      params.push(collection);
    }

    query += ' ORDER BY sp.created_at DESC';

    const [posts] = await connection.query(query, params);

    res.json({ posts });
  } catch (error) {
    console.error('Get saved posts error:', error);
    res.status(500).json({ error: 'Failed to get saved posts' });
  } finally {
    connection.release();
  }
};

// Pin/unpin a post (for profile)
export const togglePinPost = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check ownership
    const [posts] = await connection.query(
      'SELECT is_pinned FROM posts WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found or unauthorized' });
    }

    const newPinStatus = !posts[0].is_pinned;

    // If pinning, unpin other posts
    if (newPinStatus) {
      await connection.query(
        'UPDATE posts SET is_pinned = FALSE WHERE user_id = ? AND is_pinned = TRUE',
        [userId]
      );
    }

    await connection.query(
      'UPDATE posts SET is_pinned = ? WHERE id = ?',
      [newPinStatus, id]
    );

    res.json({ message: newPinStatus ? 'Post pinned' : 'Post unpinned', pinned: newPinStatus });
  } catch (error) {
    console.error('Toggle pin post error:', error);
    res.status(500).json({ error: 'Failed to pin post' });
  } finally {
    connection.release();
  }
};

// Get posts by hashtag
export const getPostsByHashtag = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { tag } = req.params;
    const userId = req.user?.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [posts] = await connection.query(
      `SELECT 
        p.*,
        u.username, u.name, u.avatar,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
        (SELECT COUNT(*) FROM post_shares WHERE post_id = p.id) as shares_count,
        ${userId ? `EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ${userId}) as is_liked,` : ''}
        ${userId ? `EXISTS(SELECT 1 FROM saved_posts WHERE post_id = p.id AND user_id = ${userId}) as is_saved` : ''}
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN post_hashtags ph ON p.id = ph.post_id
      JOIN hashtags h ON ph.hashtag_id = h.id
      WHERE h.name = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?`,
      [tag.toLowerCase(), limit, offset]
    );

    res.json({ posts });
  } catch (error) {
    console.error('Get posts by hashtag error:', error);
    res.status(500).json({ error: 'Failed to get posts' });
  } finally {
    connection.release();
  }
};

// Get trending hashtags
export const getTrendingHashtags = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const limit = parseInt(req.query.limit) || 10;

    const [hashtags] = await connection.query(
      `SELECT name, usage_count
       FROM hashtags
       ORDER BY usage_count DESC
       LIMIT ?`,
      [limit]
    );

    res.json({ hashtags });
  } catch (error) {
    console.error('Get trending hashtags error:', error);
    res.status(500).json({ error: 'Failed to get trending hashtags' });
  } finally {
    connection.release();
  }
};

// Get post edit history
export const getPostEditHistory = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;

    const [edits] = await connection.query(
      `SELECT 
        pe.*,
        u.username, u.name, u.avatar
       FROM post_edits pe
       JOIN users u ON pe.edited_by = u.id
       WHERE pe.post_id = ?
       ORDER BY pe.edited_at DESC`,
      [id]
    );

    res.json({ edits });
  } catch (error) {
    console.error('Get post edit history error:', error);
    res.status(500).json({ error: 'Failed to get edit history' });
  } finally {
    connection.release();
  }
};

export {
  extractHashtags,
  extractMentions,
  saveHashtags,
  saveMentions
};
