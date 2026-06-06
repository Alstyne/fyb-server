const pool = require('../config/db');

// ── ANALYTICS ──────────────────────────────────────────────────────────────
const getAnalytics = async (req, res) => {
  try {
    const [
      students,
      complete,
      memories,
      likes,
      comments,
      invites,
      recentJoins,
      topLiked,
      deptBreakdown,
    ] = await Promise.all([

      // Total students
      pool.query(`SELECT COUNT(*) FROM users WHERE role = 'student'`),

      // Complete profiles
      pool.query(`SELECT COUNT(*) FROM users WHERE role = 'student' AND profile_complete = TRUE`),

      // Total memories
      pool.query(`SELECT COUNT(*) FROM memories`),

      // Total likes
      pool.query(`SELECT COUNT(*) FROM likes`),

      // Total comments
      pool.query(`SELECT COUNT(*) FROM comments`),

      // Invite stats
      pool.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE used = TRUE)  AS used,
          COUNT(*) FILTER (WHERE used = FALSE AND expires_at > NOW()) AS active
        FROM invites
      `),

      // Last 5 students who joined
      pool.query(`
        SELECT id, name, department, created_at, profile_complete
        FROM users
        WHERE role = 'student'
        ORDER BY created_at DESC
        LIMIT 5
      `),

      // Top 5 most liked memories
      pool.query(`
        SELECT m.id, m.image_url, m.caption,
               u.name AS uploader,
               COUNT(l.id) AS like_count
        FROM memories m
        JOIN users u ON m.user_id = u.id
        LEFT JOIN likes l ON l.memory_id = m.id
        GROUP BY m.id, u.name
        ORDER BY like_count DESC
        LIMIT 5
      `),

      // Students per department
      pool.query(`
        SELECT department, COUNT(*) AS count
        FROM users
        WHERE role = 'student'
        GROUP BY department
        ORDER BY count DESC
      `),
    ]);

    res.json({
      totals: {
        students:        parseInt(students.rows[0].count),
        complete:        parseInt(complete.rows[0].count),
        incomplete:      parseInt(students.rows[0].count) - parseInt(complete.rows[0].count),
        memories:        parseInt(memories.rows[0].count),
        likes:           parseInt(likes.rows[0].count),
        comments:        parseInt(comments.rows[0].count),
        invites_total:   parseInt(invites.rows[0].total),
        invites_used:    parseInt(invites.rows[0].used),
        invites_active:  parseInt(invites.rows[0].active),
      },
      recentJoins:    recentJoins.rows,
      topLiked:       topLiked.rows,
      deptBreakdown:  deptBreakdown.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ── ALL MEMORIES (with moderation) ────────────────────────────────────────
const getAllMemories = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.id, m.image_url, m.caption, m.created_at,
             u.id AS user_id, u.name AS uploader,
             COUNT(l.id) AS like_count
      FROM memories m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN likes l ON l.memory_id = m.id
      GROUP BY m.id, u.id, u.name
      ORDER BY m.created_at DESC
    `);
    res.json({ memories: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ── ADMIN DELETE MEMORY ────────────────────────────────────────────────────
const adminDeleteMemory = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM memories WHERE id = $1 RETURNING id', [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Memory not found.' });
    }
    res.json({ message: 'Memory deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ── ALL COMMENTS (with moderation) ────────────────────────────────────────
const getAllComments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.comment, c.created_at,
             u.name  AS commenter_name,
             p.name  AS profile_name,
             p.id    AS profile_id
      FROM comments c
      JOIN users u ON c.user_id  = u.id
      JOIN users p ON c.profile_id = p.id
      ORDER BY c.created_at DESC
    `);
    res.json({ comments: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ── ADMIN DELETE COMMENT ───────────────────────────────────────────────────
const adminDeleteComment = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM comments WHERE id = $1 RETURNING id', [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Comment not found.' });
    }
    res.json({ message: 'Comment deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  getAnalytics,
  getAllMemories,
  adminDeleteMemory,
  getAllComments,
  adminDeleteComment,
};