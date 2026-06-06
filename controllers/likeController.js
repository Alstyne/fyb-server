const pool = require('../config/db');

// TOGGLE LIKE (like if not liked, unlike if already liked)
const toggleLike = async (req, res) => {
  const { memory_id } = req.body;
  const userId = req.user.id;

  if (!memory_id) {
    return res.status(400).json({ message: 'Memory ID is required.' });
  }

  try {
    // Check if already liked
    const existing = await pool.query(
      'SELECT id FROM likes WHERE user_id = $1 AND memory_id = $2',
      [userId, memory_id]
    );

    if (existing.rows.length > 0) {
      // Unlike
      await pool.query(
        'DELETE FROM likes WHERE user_id = $1 AND memory_id = $2',
        [userId, memory_id]
      );

      const count = await pool.query(
        'SELECT COUNT(*) FROM likes WHERE memory_id = $1',
        [memory_id]
      );

      return res.json({
        liked: false,
        like_count: parseInt(count.rows[0].count)
      });
    }

    // Like
    await pool.query(
      'INSERT INTO likes (user_id, memory_id) VALUES ($1, $2)',
      [userId, memory_id]
    );

    const count = await pool.query(
      'SELECT COUNT(*) FROM likes WHERE memory_id = $1',
      [memory_id]
    );

    res.json({
      liked: true,
      like_count: parseInt(count.rows[0].count)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// CHECK IF USER LIKED A MEMORY
const checkLike = async (req, res) => {
  const { memory_id } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'SELECT id FROM likes WHERE user_id = $1 AND memory_id = $2',
      [userId, memory_id]
    );

    res.json({ liked: result.rows.length > 0 });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { toggleLike, checkLike };