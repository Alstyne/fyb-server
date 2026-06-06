const express = require('express');
const router = express.Router();
const {
  createInvite,
  getAllInvites,
  validateInvite,
  deleteInvite
} = require('../controllers/inviteController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Public — check if a token is valid (used on register page)
router.get('/validate/:token', validateInvite);

// Admin only
router.post('/', verifyToken, verifyAdmin, createInvite);
router.get('/', verifyToken, verifyAdmin, getAllInvites);
router.delete('/:id', verifyToken, verifyAdmin, deleteInvite);

module.exports = router;