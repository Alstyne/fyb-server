const express = require('express');
const router = express.Router();
const { toggleLike, checkLike } = require('../controllers/likeController');
const { verifyToken } = require('../middleware/auth');

router.post('/toggle', verifyToken, toggleLike);
router.get('/check/:memory_id', verifyToken, checkLike);

module.exports = router;