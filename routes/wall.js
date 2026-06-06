const express = require('express');
const router  = express.Router();
const { getWall, upsertWallEntry, deleteWallEntry } = require('../controllers/wallController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);
router.get('/',    getWall);
router.post('/',   upsertWallEntry);
router.delete('/', deleteWallEntry);

module.exports = router;