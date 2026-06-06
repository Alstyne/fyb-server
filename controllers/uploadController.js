const { cloudinary } = require('../config/cloudinary');

// Upload profile image
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    res.json({
      message: 'Profile image uploaded.',
      url: req.file.path,
      public_id: req.file.filename,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed.' });
  }
};

// Upload memory image
const uploadMemoryImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    res.json({
      message: 'Memory image uploaded.',
      url: req.file.path,
      public_id: req.file.filename,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed.' });
  }
};

// Delete image from Cloudinary
const deleteImage = async (req, res) => {
  const { public_id } = req.body;

  if (!public_id) {
    return res.status(400).json({ message: 'public_id is required.' });
  }

  try {
    await cloudinary.uploader.destroy(public_id);
    res.json({ message: 'Image deleted from Cloudinary.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Delete failed.' });
  }
};

module.exports = { uploadProfileImage, uploadMemoryImage, deleteImage };