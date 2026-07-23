/**
 * Cloudinary Error Handler
 * Provides consistent error handling and logging for Cloudinary operations
 */

class CloudinaryError extends Error {
  constructor(message, statusCode = 500, originalError = null) {
    super(message);
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.name = 'CloudinaryError';
  }
}

/**
 * Handle upload errors
 */
const handleUploadError = (error) => {
  console.error('❌ Upload Error:', error.message);

  if (error.message.includes('Invalid file type')) {
    return new CloudinaryError(
      'Invalid file format. Allowed: JPG, PNG, GIF, WebP, AVIF, SVG',
      400,
      error
    );
  }

  if (error.message.includes('fileSize')) {
    return new CloudinaryError(
      'File size exceeds 10MB limit',
      400,
      error
    );
  }

  if (error.message.includes('No file buffer provided')) {
    return new CloudinaryError(
      'No file provided for upload',
      400,
      error
    );
  }

  if (error.http_code === 401) {
    return new CloudinaryError(
      'Cloudinary authentication failed. Check API credentials.',
      500,
      error
    );
  }

  if (error.http_code === 400) {
    return new CloudinaryError(
      `Invalid request to Cloudinary: ${error.message}`,
      400,
      error
    );
  }

  if (error.http_code === 429) {
    return new CloudinaryError(
      'Cloudinary rate limit exceeded. Please try again later.',
      429,
      error
    );
  }

  if (error.message.includes('ENOENT') || error.message.includes('not found')) {
    return new CloudinaryError(
      'Upload failed: File not found',
      404,
      error
    );
  }

  // Generic network error
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return new CloudinaryError(
      'Connection to Cloudinary failed. Please check your internet connection.',
      503,
      error
    );
  }

  return new CloudinaryError(
    `Failed to upload image: ${error.message}`,
    500,
    error
  );
};

/**
 * Handle deletion errors
 */
const handleDeletionError = (error) => {
  console.error('❌ Deletion Error:', error.message);

  if (error.http_code === 401) {
    return new CloudinaryError(
      'Cloudinary authentication failed. Cannot delete image.',
      500,
      error
    );
  }

  if (error.message.includes('not found') || error.result === 'not found') {
    // Image already deleted, not an error
    return null;
  }

  return new CloudinaryError(
    `Failed to delete image: ${error.message}`,
    500,
    error
  );
};

/**
 * Middleware for handling Cloudinary errors in Express
 */
const cloudinaryErrorHandler = (error, req, res, next) => {
  if (!(error instanceof CloudinaryError)) {
    return next(error);
  }

  console.error(`[Cloudinary Error] ${error.statusCode}: ${error.message}`);

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    error: process.env.NODE_ENV === 'development' ? error.originalError?.message : undefined,
  });
};

/**
 * Validate configuration before operations
 */
const validateCloudinarySetup = () => {
  const required = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new CloudinaryError(
      `Missing Cloudinary configuration: ${missing.join(', ')}`,
      500
    );
  }
};

module.exports = {
  CloudinaryError,
  handleUploadError,
  handleDeletionError,
  cloudinaryErrorHandler,
  validateCloudinarySetup,
};
