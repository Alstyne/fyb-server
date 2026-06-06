const express = require('express');
const router = express.Router();
const {
  addMemory,
  getAllMemories,
  getMemoryById,
  deleteMemory
} = require('../controllers/memoryController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, getAllMemories);
router.get('/:id', verifyToken, getMemoryById);
router.post('/', verifyToken, addMemory);
router.delete('/:id', verifyToken, deleteMemory);

module.exports = router;