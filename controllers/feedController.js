const pool = require('../config/db');

// GET ALL POSTS (feed)
const getPosts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.content, p.image_url, p.created_at,
             u.id AS user_id, u.name, u.nickname,
             u.profile_image, u.department,
             COUNT(DISTINCT pl.id)  AS like_count,
             COUNT(DISTINCT pc.id)  AS comment_count,
             BOOL_OR(pl.user_id = $1) AS liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN post_likes    pl ON pl.post_id = p.id
      LEFT JOIN post_comments pc ON pc.post_id = p.id
      GROUP BY p.id, u.id
      ORDER BY p.created_at DESC
    `, [req.user.id]);

    res.json({ posts: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// CREATE POST
const createPost = async (req, res) => {
  const { content, image_url } = req.body;
  if (!content?.trim()) {
    return res.status(400).json({ message: 'Content is required.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO posts (user_id, content, image_url)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, content, image_url || null]
    );

    const full = await pool.query(`
      SELECT p.id, p.content, p.image_url, p.created_at,
             u.id AS user_id, u.name, u.nickname,
             u.profile_image, u.department,
             0 AS like_count, 0 AS comment_count, false AS liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `, [result.rows[0].id]);

    res.status(201).json({ post: full.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE POST
const deletePost = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await pool.query('SELECT user_id FROM posts WHERE id = $1', [id]);
    if (post.rows.length === 0) return res.status(404).json({ message: 'Post not found.' });
    if (post.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized.' });
    }
    await pool.query('DELETE FROM posts WHERE id = $1', [id]);
    res.json({ message: 'Post deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// TOGGLE POST LIKE
const togglePostLike = async (req, res) => {
  const { post_id } = req.body;
  const userId = req.user.id;
  try {
    const existing = await pool.query(
      'SELECT id FROM post_likes WHERE user_id = $1 AND post_id = $2',
      [userId, post_id]
    );
    if (existing.rows.length > 0) {
      await pool.query(
        'DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2',
        [userId, post_id]
      );
    } else {
      await pool.query(
        'INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2)',
        [userId, post_id]
      );
    }
    const count = await pool.query(
      'SELECT COUNT(*) FROM post_likes WHERE post_id = $1', [post_id]
    );
    const liked = existing.rows.length === 0;
    res.json({ liked, like_count: parseInt(count.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET POST COMMENTS
const getPostComments = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT pc.id, pc.comment, pc.created_at,
             u.name, u.nickname, u.profile_image
      FROM post_comments pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.post_id = $1
      ORDER BY pc.created_at ASC
    `, [id]);
    res.json({ comments: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ADD POST COMMENT
const addPostComment = async (req, res) => {
  const { post_id, comment } = req.body;
  if (!comment?.trim()) return res.status(400).json({ message: 'Comment required.' });
  try {
    const result = await pool.query(
      `INSERT INTO post_comments (user_id, post_id, comment)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, post_id, comment]
    );
    const full = await pool.query(`
      SELECT pc.id, pc.comment, pc.created_at,
             u.name, u.nickname, u.profile_image
      FROM post_comments pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.id = $1
    `, [result.rows[0].id]);
    res.status(201).json({ comment: full.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE POST COMMENT
const deletePostComment = async (req, res) => {
  const { id } = req.params;
  try {
    const c = await pool.query('SELECT user_id FROM post_comments WHERE id = $1', [id]);
    if (c.rows.length === 0) return res.status(404).json({ message: 'Not found.' });
    if (c.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized.' });
    }
    await pool.query('DELETE FROM post_comments WHERE id = $1', [id]);
    res.json({ message: 'Comment deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  getPosts, createPost, deletePost,
  togglePostLike,
  getPostComments, addPostComment, deletePostComment,
};