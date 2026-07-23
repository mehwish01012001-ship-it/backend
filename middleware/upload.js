/**
 * Upload middleware for handling file uploads
 * Files are streamed directly to Cloudinary via cloudinaryService
 */

const uploadMiddleware = require('./cloudinaryUpload');

module.exports = uploadMiddleware;
