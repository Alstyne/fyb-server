const pool = require('../config/db');

// ── GET ALL USERS (yearbook home grid) ───────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, nickname, department, bio, profile_image,
              profile_complete, personality_tags, created_at,
              link_x, link_whatsapp, link_facebook, link_instagram
       FROM users
       WHERE role = 'student'
       ORDER BY name ASC`
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ── GET SINGLE USER PROFILE (full finalist card data) ────────────
const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const userResult = await pool.query(
      `SELECT
         id, name, nickname, email, department, bio, profile_image,
         date_of_birth, relationship_status, favourite_food,
         childhood_dream, favourite_course, worst_course,
         favourite_lecturer, most_difficult_topic, social_handle,
         num_favourite_courses, experience, most_memorable_day,
         parting_words, profile_complete, role, created_at,
         personality_tags, celebrating_name, celebrating_dept,
         if_not_stats,
         link_x, link_whatsapp, link_facebook, link_instagram,
         at_a_glance
       FROM users WHERE id = $1`,
      [id]
    );

    if (userResult.rows.length === 0)
      return res.status(404).json({ message: 'User not found.' });

    const memoriesResult = await pool.query(
      `SELECT m.id, m.image_url, m.caption, m.created_at,
              COUNT(l.id) AS like_count
       FROM memories m
       LEFT JOIN likes l ON l.memory_id = m.id
       WHERE m.user_id = $1
       GROUP BY m.id
       ORDER BY m.created_at DESC`,
      [id]
    );

    const commentsResult = await pool.query(
      `SELECT c.id, c.comment, c.created_at,
              u.name AS commenter_name,
              u.profile_image AS commenter_image
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.profile_id = $1
       ORDER BY c.created_at DESC`,
      [id]
    );

    res.json({
      user: userResult.rows[0],
      memories: memoriesResult.rows,
      comments: commentsResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ── UPDATE PROFILE ────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  const { id } = req.params;

  if (req.user.id !== id && req.user.role !== 'admin')
    return res.status(403).json({ message: 'Unauthorized.' });

  const {
    name, department, bio, profile_image,
    nickname, date_of_birth, relationship_status,
    favourite_food, childhood_dream,
    favourite_course, worst_course,
    favourite_lecturer, most_difficult_topic,
    social_handle, num_favourite_courses,
    experience, most_memorable_day, parting_words,
    personality_tags, celebrating_name, celebrating_dept,
    if_not_stats,
    // Social media links
    link_x, link_whatsapp, link_facebook, link_instagram,
    // At a Glance — stored as JSONB array of { label, value } objects
    at_a_glance,
  } = req.body;

  const isComplete = !!(
    name && nickname && department && bio && favourite_course && parting_words
  );

  try {
    // Ensure new columns exist (idempotent migration)
    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS link_x          TEXT,
        ADD COLUMN IF NOT EXISTS link_whatsapp   TEXT,
        ADD COLUMN IF NOT EXISTS link_facebook   TEXT,
        ADD COLUMN IF NOT EXISTS link_instagram  TEXT,
        ADD COLUMN IF NOT EXISTS at_a_glance     JSONB DEFAULT '[]'::jsonb
    `);

    const result = await pool.query(
      `UPDATE users SET
        name                  = COALESCE($1,  name),
        department            = COALESCE($2,  department),
        bio                   = COALESCE($3,  bio),
        profile_image         = COALESCE($4,  profile_image),
        nickname              = COALESCE($5,  nickname),
        date_of_birth         = COALESCE($6,  date_of_birth),
        relationship_status   = COALESCE($7,  relationship_status),
        favourite_food        = COALESCE($8,  favourite_food),
        childhood_dream       = COALESCE($9,  childhood_dream),
        favourite_course      = COALESCE($10, favourite_course),
        worst_course          = COALESCE($11, worst_course),
        favourite_lecturer    = COALESCE($12, favourite_lecturer),
        most_difficult_topic  = COALESCE($13, most_difficult_topic),
        social_handle         = COALESCE($14, social_handle),
        num_favourite_courses = COALESCE($15, num_favourite_courses),
        experience            = COALESCE($16, experience),
        most_memorable_day    = COALESCE($17, most_memorable_day),
        parting_words         = COALESCE($18, parting_words),
        personality_tags      = COALESCE($19, personality_tags),
        celebrating_name      = COALESCE($20, celebrating_name),
        celebrating_dept      = COALESCE($21, celebrating_dept),
        if_not_stats          = COALESCE($22, if_not_stats),
        link_x                = COALESCE($23, link_x),
        link_whatsapp         = COALESCE($24, link_whatsapp),
        link_facebook         = COALESCE($25, link_facebook),
        link_instagram        = COALESCE($26, link_instagram),
        at_a_glance           = COALESCE($27::jsonb, at_a_glance),
        profile_complete      = $28
       WHERE id = $29
       RETURNING *`,
      [
        name, department, bio, profile_image,
        nickname, date_of_birth, relationship_status,
        favourite_food, childhood_dream,
        favourite_course, worst_course,
        favourite_lecturer, most_difficult_topic,
        social_handle, num_favourite_courses,
        experience, most_memorable_day, parting_words,
        personality_tags, celebrating_name, celebrating_dept,
        if_not_stats,
        link_x, link_whatsapp, link_facebook, link_instagram,
        at_a_glance ? JSON.stringify(at_a_glance) : null,
        isComplete,
        id,
      ]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: 'User not found.' });

    const { password, ...safeUser } = result.rows[0];
    res.json({ message: 'Profile updated.', user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ── DELETE USER (admin only) ─────────────────────────────────────
const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id', [id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'User deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ── RUN MIGRATION ON STARTUP (safe, idempotent) ──────────────────
const runMigration = async () => {
  try {
    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS link_x          TEXT,
        ADD COLUMN IF NOT EXISTS link_whatsapp   TEXT,
        ADD COLUMN IF NOT EXISTS link_facebook   TEXT,
        ADD COLUMN IF NOT EXISTS link_instagram  TEXT,
        ADD COLUMN IF NOT EXISTS at_a_glance     JSONB DEFAULT '[]'::jsonb
    `);
    console.log('✅ User table migration complete (social links + at_a_glance)');
  } catch (err) {
    console.error('Migration error:', err.message);
  }
};

runMigration();

module.exports = { getAllUsers, getUserById, updateProfile, deleteUser };
