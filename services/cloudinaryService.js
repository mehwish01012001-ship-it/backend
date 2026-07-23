const { cloudinary, getUploadOptions, OPTIMIZATION_SETTINGS } = require('../config/cloudinary');
const streamifier = require('streamifier');

/**
 * Upload a single image to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer from multer memoryStorage
 * @param {string} contentType - Content type (e.g., 'products', 'categories')
 * @param {object} options - Additional Cloudinary options
 * @returns {Promise<object>} - Upload result with url and publicId
 */
exports.uploadSingleImage = async (fileBuffer, contentType, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) {
      return reject(new Error('No file buffer provided'));
    }

    const uploadOptions = getUploadOptions(contentType, options);
    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        console.error('❌ Cloudinary upload error:', error);
        return reject(new Error(`Failed to upload image: ${error.message}`));
      }

      console.log(`✅ Image uploaded to Cloudinary: ${result.public_id}`);
      resolve({
        url: result.secure_url,
        publicId: result.public_id,
        fileName: result.original_filename,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
      });
    });

    // Stream the buffer to Cloudinary
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

/**
 * Upload multiple images to Cloudinary
 * @param {Array<Buffer>} fileBuffers - Array of file buffers
 * @param {string} contentType - Content type for all images
 * @param {object} options - Additional Cloudinary options
 * @returns {Promise<Array>} - Array of upload results
 */
exports.uploadMultipleImages = async (fileBuffers, contentType, options = {}) => {
  if (!Array.isArray(fileBuffers) || fileBuffers.length === 0) {
    throw new Error('No files provided for upload');
  }

  const uploadPromises = fileBuffers.map((buffer) =>
    exports.uploadSingleImage(buffer, contentType, options)
  );

  try {
    const results = await Promise.all(uploadPromises);
    console.log(`✅ ${results.length} images uploaded successfully`);
    return results;
  } catch (error) {
    console.error('❌ Error uploading multiple images:', error);
    throw error;
  }
};

/**
 * Delete an image from Cloudinary by public ID
 * @param {string} publicId - The Cloudinary public ID
 * @returns {Promise<object>} - Deletion result
 */
exports.deleteImage = async (publicId) => {
  if (!publicId) {
    console.warn('⚠️ No publicId provided for deletion');
    return { success: false };
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result === 'ok') {
      console.log(`✅ Image deleted from Cloudinary: ${publicId}`);
    } else {
      console.warn(`⚠️ Failed to delete image ${publicId}: ${result.result}`);
    }
    return result;
  } catch (error) {
    console.error(`❌ Error deleting image ${publicId}:`, error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param {Array<string>} publicIds - Array of public IDs
 * @returns {Promise<Array>} - Array of deletion results
 */
exports.deleteMultipleImages = async (publicIds) => {
  if (!Array.isArray(publicIds) || publicIds.length === 0) {
    console.warn('⚠️ No public IDs provided for deletion');
    return [];
  }

  const deletePromises = publicIds
    .filter((id) => id) // Filter out empty IDs
    .map((publicId) => exports.deleteImage(publicId));

  try {
    const results = await Promise.all(deletePromises);
    console.log(`✅ ${results.length} images deleted from Cloudinary`);
    return results;
  } catch (error) {
    console.error('❌ Error deleting multiple images:', error);
    throw error;
  }
};

/**
 * Generate optimized image URL with transformations
 * @param {string} publicId - Cloudinary public ID
 * @param {string} transformationType - Type of transformation (thumbnail, small, medium, large, banner, heroSlider)
 * @returns {string} - Optimized image URL
 */
exports.generateOptimizedUrl = (publicId, transformationType = 'medium') => {
  if (!publicId) return null;

  try {
    const url = cloudinary.url(publicId, {
      ...OPTIMIZATION_SETTINGS,
      quality: 'auto',
      fetch_format: 'auto',
      dpr: 'auto',
    });

    return url;
  } catch (error) {
    console.error('Error generating optimized URL:', error);
    return cloudinary.url(publicId);
  }
};

/**
 * Generate thumbnail URL for an image
 * @param {string} publicId - Cloudinary public ID
 * @param {number} width - Thumbnail width (default: 150)
 * @param {number} height - Thumbnail height (default: 150)
 * @returns {string} - Thumbnail URL
 */
exports.generateThumbnailUrl = (publicId, width = 150, height = 150) => {
  if (!publicId) return null;

  try {
    return cloudinary.url(publicId, {
      width,
      height,
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto',
      fetch_format: 'auto',
      dpr: 'auto',
    });
  } catch (error) {
    console.error('Error generating thumbnail URL:', error);
    return null;
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string} - Public ID
 */
exports.extractPublicId = (url) => {
  if (!url) return null;

  try {
    // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{ext}
    const match = url.match(/\/([^/]+)\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    return match ? match[2] : null;
  } catch (error) {
    console.error('Error extracting public ID from URL:', error);
    return null;
  }
};

/**
 * Validate Cloudinary credentials are configured
 * @returns {boolean} - True if credentials are valid
 */
exports.validateCloudinaryConfig = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error(
      '❌ Cloudinary configuration is incomplete. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET'
    );
    return false;
  }

  return true;
};

/**
 * Get image metadata from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<object>} - Image metadata
 */
exports.getImageMetadata = async (publicId) => {
  if (!publicId) {
    throw new Error('Public ID is required');
  }

  try {
    const result = await cloudinary.api.resource(publicId);
    return {
      publicId: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes,
      created: result.created_at,
      folder: result.folder,
    };
  } catch (error) {
    console.error('Error getting image metadata:', error);
    throw new Error(`Failed to get image metadata: ${error.message}`);
  }
};
