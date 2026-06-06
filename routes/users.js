const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateProfile,
  deleteUser
} = require('../controllers/userController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

router.get('/', verifyToken, getAllUsers);
router.get('/:id', verifyToken, getUserById);
router.put('/:id', verifyToken, updateProfile);
router.delete('/:id', verifyToken, verifyAdmin, deleteUser);

module.exports = router;