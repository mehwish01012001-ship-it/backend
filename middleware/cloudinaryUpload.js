const multer = require('multer');
const { isAllowedFormat } = require('../config/cloudinary');

/**
 * Multer middleware for handling file uploads to Cloudinary
 * Uses memory storage since files are streamed directly to Cloudinary
 */

// Use memory storage - files are held in memory before being streamed to Cloudinary
const storage = multer.memoryStorage();

const VIDEO_MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const IMAGE_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * File filter to validate uploaded files
 * @param {object} req - Express request object
 * @param {object} file - The uploaded file object
 * @param {function} cb - Callback function
 */
const fileFilter = (req, file, cb) => {
  if (!isAllowedFormat(file.mimetype)) {
    return cb(new Error(`Invalid file type. Only image and video files are allowed. Received: ${file.mimetype}`));
  }

  const isVideo = file.mimetype.startsWith('video/');
  const maxSize = isVideo ? VIDEO_MAX_FILE_SIZE : IMAGE_MAX_FILE_SIZE;

  if (file.size > maxSize) {
    return cb(new Error(`File size exceeds ${isVideo ? '100MB' : '10MB'} limit`));
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
    fileSize: VIDEO_MAX_FILE_SIZE,
    files: 10, // Maximum 10 files per request
  },
});

module.exports = uploadMiddleware;
