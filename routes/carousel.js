const express = require('express');
const router = express.Router();
const { getFeatured, refreshFeatured } = require('../controllers/carouselController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Get today's 3 featured students
router.get('/', verifyToken, getFeatured);

// Admin: force-refresh today's featured
router.delete('/refresh', verifyToken, verifyAdmin, refreshFeatured);

module.exports = router;