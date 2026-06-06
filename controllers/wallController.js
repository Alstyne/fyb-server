const pool = require('../config/db');

// GET ALL WALL ENTRIES
const getWall = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT w.*, u.name, u.profile_image
      FROM wall_entries w
      JOIN users u ON w.user_id = u.id
      ORDER BY w.created_at ASC
    `);
    res.json({ entries: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ADD OR UPDATE WALL ENTRY
const upsertWallEntry = async (req, res) => {
  const { nickname, message, font_index, pos_x, pos_y, rotation, color } = req.body;
  const userId = req.user.id;

  if (!nickname?.trim()) {
    return res.status(400).json({ message: 'Nickname is required.' });
  }

  try {
    const result = await pool.query(`
      INSERT INTO wall_entries
        (user_id, nickname, message, font_index, pos_x, pos_y, rotation, color)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (user_id) DO UPDATE SET
        nickname   = EXCLUDED.nickname,
        message    = EXCLUDED.message,
        font_index = EXCLUDED.font_index,
        pos_x      = EXCLUDED.pos_x,
        pos_y      = EXCLUDED.pos_y,
        rotation   = EXCLUDED.rotation,
        color      = EXCLUDED.color
      RETURNING *
    `, [userId, nickname, message, font_index, pos_x, pos_y, rotation, color]);

    res.json({ entry: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE WALL ENTRY
const deleteWallEntry = async (req, res) => {
  try {
    await pool.query('DELETE FROM wall_entries WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Wall entry removed.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getWall, upsertWallEntry, deleteWallEntry };