const express = require('express');
const router = express.Router();
const { uploadProfile, uploadMemory } = require('../config/cloudinary');
const {
  uploadProfileImage,
  uploadMemoryImage,
  deleteImage,
} = require('../controllers/uploadController');
const { verifyToken } = require('../middleware/auth');

// Upload profile photo
router.post(
  '/profile',
  verifyToken,
  uploadProfile.single('image'),
  uploadProfileImage
);

// Upload memory photo
router.post(
  '/memory',
  verifyToken,
  uploadMemory.single('image'),
  uploadMemoryImage
);

// Delete image
router.delete('/', verifyToken, deleteImage);

module.exports = router;