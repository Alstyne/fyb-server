const pool = require('../config/db');

// ADD COMMENT to a profile
const addComment = async (req, res) => {
  const { profile_id, comment } = req.body;
  const userId = req.user.id;

  if (!comment || !profile_id) {
    return res.status(400).json({ message: 'Profile ID and comment are required.' });
  }

  try {
    // Check profile exists
    const profileExists = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [profile_id]
    );

    if (profileExists.rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    const result = await pool.query(
      `INSERT INTO comments (user_id, profile_id, comment)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, profile_id, comment]
    );

    // Return comment with commenter details
    const full = await pool.query(
      `SELECT c.id, c.comment, c.created_at,
              u.name AS commenter_name,
              u.profile_image AS commenter_image
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json({ message: 'Comment added.', comment: full.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET COMMENTS on a profile
const getCommentsByProfile = async (req, res) => {
  const { profile_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT c.id, c.comment, c.created_at,
              u.name AS commenter_name,
              u.profile_image AS commenter_image
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.profile_id = $1
       ORDER BY c.created_at DESC`,
      [profile_id]
    );

    res.json({ comments: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE COMMENT
const deleteComment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const comment = await pool.query(
      'SELECT user_id FROM comments WHERE id = $1',
      [id]
    );

    if (comment.rows.length === 0) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    if (comment.rows[0].user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    await pool.query('DELETE FROM comments WHERE id = $1', [id]);

    res.json({ message: 'Comment deleted.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { addComment, getCommentsByProfile, deleteComment };