const express = require('express');
const router = express.Router();
const {
  addComment,
  getCommentsByProfile,
  deleteComment
} = require('../controllers/commentController');
const { verifyToken } = require('../middleware/auth');

router.get('/:profile_id', verifyToken, getCommentsByProfile);
router.post('/', verifyToken, addComment);
router.delete('/:id', verifyToken, deleteComment);

module.exports = router;