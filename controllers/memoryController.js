const pool = require('../config/db');

// ADD MEMORY
const addMemory = async (req, res) => {
  const { image_url, caption } = req.body;
  const userId = req.user.id;

  if (!image_url) {
    return res.status(400).json({ message: 'Image URL is required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO memories (user_id, image_url, caption)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, image_url, caption]
    );

    res.status(201).json({ message: 'Memory added.', memory: result.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET ALL MEMORIES (for yearbook feed)
const getAllMemories = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.id, m.image_url, m.caption, m.created_at,
              u.id AS user_id, u.name, u.profile_image,
              COUNT(l.id) AS like_count
       FROM memories m
       JOIN users u ON m.user_id = u.id
       LEFT JOIN likes l ON l.memory_id = m.id
       GROUP BY m.id, u.id
       ORDER BY m.created_at DESC`
    );

    res.json({ memories: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET SINGLE MEMORY
const getMemoryById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT m.id, m.image_url, m.caption, m.created_at,
              u.id AS user_id, u.name, u.profile_image,
              COUNT(l.id) AS like_count
       FROM memories m
       JOIN users u ON m.user_id = u.id
       LEFT JOIN likes l ON l.memory_id = m.id
       WHERE m.id = $1
       GROUP BY m.id, u.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Memory not found.' });
    }

    res.json({ memory: result.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE MEMORY
const deleteMemory = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Only owner or admin can delete
    const memory = await pool.query(
      'SELECT user_id FROM memories WHERE id = $1',
      [id]
    );

    if (memory.rows.length === 0) {
      return res.status(404).json({ message: 'Memory not found.' });
    }

    if (memory.rows[0].user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    await pool.query('DELETE FROM memories WHERE id = $1', [id]);

    res.json({ message: 'Memory deleted.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { addMemory, getAllMemories, getMemoryById, deleteMemory };