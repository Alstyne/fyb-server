const pool = require('../config/db');

// GET TODAY'S 3 FEATURED STUDENTS
// If not yet picked for today, picks 3 random students automatically
const getFeatured = async (req, res) => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    // Check if today's featured are already set
    const existing = await pool.query(
      `SELECT cf.slot, u.id, u.name, u.nickname, u.department, u.bio,
              u.profile_image, u.favourite_course, u.worst_course,
              u.favourite_lecturer, u.most_difficult_topic, u.social_handle,
              u.num_favourite_courses, u.experience, u.most_memorable_day,
              u.parting_words, u.date_of_birth, u.relationship_status,
              u.favourite_food, u.childhood_dream, u.profile_complete
       FROM carousel_featured cf
       JOIN users u ON cf.user_id = u.id
       WHERE cf.featured_date = $1
       ORDER BY cf.slot ASC`,
      [today]
    );

    if (existing.rows.length === 3) {
      return res.json({ featured: existing.rows, date: today });
    }

    // Not yet picked — select 3 random COMPLETE profiles
    const candidates = await pool.query(
      `SELECT id FROM users
       WHERE role = 'student'
         AND profile_complete = TRUE
         AND id NOT IN (
           SELECT user_id FROM carousel_featured
           WHERE featured_date > (CURRENT_DATE - INTERVAL '7 days')
         )
       ORDER BY RANDOM()
       LIMIT 3`
    );

    // Fallback: if not enough complete profiles, pick any students
    let picks = candidates.rows;
    if (picks.length < 3) {
      const fallback = await pool.query(
        `SELECT id FROM users
         WHERE role = 'student'
         ORDER BY RANDOM()
         LIMIT 3`
      );
      picks = fallback.rows;
    }

    if (picks.length === 0) {
      return res.json({ featured: [], date: today });
    }

    // Insert into carousel_featured
    // Delete any partial entries for today first
    await pool.query(
      'DELETE FROM carousel_featured WHERE featured_date = $1', [today]
    );

    for (let i = 0; i < picks.length; i++) {
      await pool.query(
        `INSERT INTO carousel_featured (user_id, featured_date, slot)
         VALUES ($1, $2, $3)`,
        [picks[i].id, today, i + 1]
      );
    }

    // Fetch full data for the newly picked students
    const fresh = await pool.query(
      `SELECT cf.slot, u.id, u.name, u.nickname, u.department, u.bio,
              u.profile_image, u.favourite_course, u.worst_course,
              u.favourite_lecturer, u.most_difficult_topic, u.social_handle,
              u.num_favourite_courses, u.experience, u.most_memorable_day,
              u.parting_words, u.date_of_birth, u.relationship_status,
              u.favourite_food, u.childhood_dream, u.profile_complete
       FROM carousel_featured cf
       JOIN users u ON cf.user_id = u.id
       WHERE cf.featured_date = $1
       ORDER BY cf.slot ASC`,
      [today]
    );

    res.json({ featured: fresh.rows, date: today });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ADMIN: Manually refresh today's featured students
const refreshFeatured = async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    await pool.query(
      'DELETE FROM carousel_featured WHERE featured_date = $1', [today]
    );
    res.json({ message: 'Featured cleared. Will repick on next request.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// MANUAL OVERRIDE — Admin picks specific students for today
const setFeatured = async (req, res) => {
  const { user_ids } = req.body; // array of exactly 3 user IDs

  if (!Array.isArray(user_ids) || user_ids.length !== 3) {
    return res.status(400).json({ message: 'Provide exactly 3 user IDs.' });
  }

  const today = new Date().toISOString().split('T')[0];

  try {
    // Verify all users exist and are students
    const check = await pool.query(
      `SELECT id FROM users WHERE id = ANY($1) AND role = 'student'`,
      [user_ids]
    );

    if (check.rows.length !== 3) {
      return res.status(400).json({ message: 'One or more user IDs are invalid.' });
    }

    // Clear today's existing featured
    await pool.query(
      'DELETE FROM carousel_featured WHERE featured_date = $1', [today]
    );

    // Insert the manually chosen ones
    for (let i = 0; i < user_ids.length; i++) {
      await pool.query(
        `INSERT INTO carousel_featured (user_id, featured_date, slot)
         VALUES ($1, $2, $3)`,
        [user_ids[i], today, i + 1]
      );
    }

    res.json({ message: 'Finalist of the Day updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getFeatured, refreshFeatured, setFeatured };