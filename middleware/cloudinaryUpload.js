const multer = require('multer');
const { isAllowedFormat } = require('../config/cloudinary');

/**
 * Multer middleware for handling file uploads to Cloudinary
 * Uses memory storage since files are streamed directly to Cloudinary
 */

// Use memory storage - files are held in memory before being streamed to Cloudinary
const storage = multer.memoryStorage();

/**
 * File filter to validate uploaded files
 * @param {object} req - Express request object
 * @param {object} file - The uploaded file object
 * @param {function} cb - Callback function
 */
const fileFilter = (req, file, cb) => {
  // Check if file type is allowed
  if (!isAllowedFormat(file.mimetype)) {
    return cb(new Error(`Invalid file type. Only image files are allowed. Received: ${file.mimetype}`));
  }

  // Check file size (10MB limit per file)
  if (file.size > 10 * 1024 * 1024) {
    return cb(new Error('File size exceeds 10MB limit'));
  }

  cb(null, true);
};

/**
 * Multer upload middleware configuration
 */
const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10, // Maximum 10 files per request
  },
});

module.exports = uploadMiddleware;
