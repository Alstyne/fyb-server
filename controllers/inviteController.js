const pool = require('../config/db');
const crypto = require('crypto');
require('dotenv').config();

// CREATE INVITE (Admin only)
const createInvite = async (req, res) => {
  const { email } = req.body;
  const adminId = req.user.id;

  try {
    // 1. Check if email already has an active invite
    const existing = await pool.query(
      `SELECT id FROM invites 
       WHERE email = $1 AND used = FALSE AND expires_at > NOW()`,
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Active invite already exists for this email.' });
    }

    // 2. Check if user already registered
    const userExists = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // 3. Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // 4. Save invite
    const invite = await pool.query(
      `INSERT INTO invites (email, token, expires_at, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, token, expires_at`,
      [email, token, expiresAt, adminId]
    );

    // 5. Build invite link
    const inviteLink = `${process.env.CLIENT_URL}/register?token=${token}`;

    res.status(201).json({
      message: 'Invite created successfully.',
      invite: invite.rows[0],
      inviteLink
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET ALL INVITES (Admin only)
const getAllInvites = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.id, i.email, i.token, i.expires_at, i.used,
              u.name AS created_by_name
       FROM invites i
       LEFT JOIN users u ON i.created_by = u.id
       ORDER BY i.created_at DESC`
    );

    res.json({ invites: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// VALIDATE INVITE TOKEN (Public — used on register page)
const validateInvite = async (req, res) => {
  const { token } = req.params;

  try {
    const result = await pool.query(
      `SELECT email, expires_at, used 
       FROM invites 
       WHERE token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ valid: false, message: 'Invite not found.' });
    }

    const invite = result.rows[0];

    if (invite.used) {
      return res.status(400).json({ valid: false, message: 'Invite already used.' });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return res.status(400).json({ valid: false, message: 'Invite has expired.' });
    }

    res.json({ valid: true, email: invite.email });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE INVITE (Admin only)
const deleteInvite = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM invites WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Invite not found.' });
    }

    res.json({ message: 'Invite deleted.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { createInvite, getAllInvites, validateInvite, deleteInvite };