const express = require('express');
const router = express.Router();
const {
  getAnalytics,
  getAllMemories,
  adminDeleteMemory,
  getAllComments,
  adminDeleteComment,
} = require('../controllers/adminController');
const { setFeatured, refreshFeatured } = require('../controllers/carouselController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// All admin routes are protected — token + admin role required
router.use(verifyToken, verifyAdmin);

router.get('/analytics',          getAnalytics);
router.get('/memories',           getAllMemories);
router.delete('/memories/:id',    adminDeleteMemory);
router.get('/comments',           getAllComments);
router.delete('/comments/:id',    adminDeleteComment);
router.post('/carousel/set',      setFeatured);
router.delete('/carousel/refresh',refreshFeatured);

module.exports = router;