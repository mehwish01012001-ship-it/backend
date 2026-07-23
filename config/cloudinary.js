const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload folder mapping for different content types
 * Maps content types to Cloudinary folder paths
 */
const CLOUDINARY_FOLDERS = {
  // Product images
  products: 'rq-fashion/products',
  productVariants: 'rq-fashion/products/variants',
  productGallery: 'rq-fashion/products/gallery',

  // Category and Collection
  categories: 'rq-fashion/categories',
  subcategories: 'rq-fashion/categories/subcategories',
  collections: 'rq-fashion/collections',

  // Brand and Logo
  brands: 'rq-fashion/brands',
  logos: 'rq-fashion/site/logos',

  // Hero Slider
  'hero-slider': 'rq-fashion/hero-slider',
  heroSlider: 'rq-fashion/hero-slider',

  // User and Admin
  users: 'rq-fashion/users/avatars',
  customers: 'rq-fashion/customers/avatars',
  admins: 'rq-fashion/admins/avatars',

  // Banners and Promotions
  banners: 'rq-fashion/banners',
  offers: 'rq-fashion/offers',
  coupons: 'rq-fashion/coupons',

  // Content
  reviews: 'rq-fashion/reviews',
  gallery: 'rq-fashion/gallery',
  blog: 'rq-fashion/blog',

  // Brand Story and Lookbook
  'brand-story': 'rq-fashion/brand-story',
  brandStory: 'rq-fashion/brand-story',
  lookbook: 'rq-fashion/lookbook',

  // Seasonal
  season: 'rq-fashion/seasonal',
  seasonal: 'rq-fashion/seasonal',

  // Wishlist
  wishlist: 'rq-fashion/wishlist',

  // Site Settings
  settings: 'rq-fashion/site/settings',
  site: 'rq-fashion/site',
};

/**
 * Allowed file types and their MIME types
 */
const ALLOWED_FORMATS = {
  images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'],
  mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml'],
};

/**
 * Image optimization settings for Cloudinary
 */
const OPTIMIZATION_SETTINGS = {
  quality: 'auto',
  fetch_format: 'auto',
  flags: 'progressive',
  dpr: 'auto',
};

/**
 * Image transformation presets
 */
const TRANSFORMATION_PRESETS = {
  thumbnail: {
    width: 150,
    height: 150,
    crop: 'fill',
    gravity: 'auto',
  },
  small: {
    width: 300,
    height: 300,
    crop: 'fill',
    gravity: 'auto',
  },
  medium: {
    width: 600,
    height: 600,
    crop: 'fill',
    gravity: 'auto',
  },
  large: {
    width: 1000,
    height: 1000,
    crop: 'fill',
    gravity: 'auto',
  },
  banner: {
    width: 1200,
    height: 400,
    crop: 'fill',
    gravity: 'auto',
  },
  heroSlider: {
    width: 1920,
    height: 600,
    crop: 'fill',
    gravity: 'auto',
  },
};

/**
 * Get the Cloudinary folder for a given content type
 * @param {string} contentType - The content type (e.g., 'products', 'categories')
 * @returns {string} - The Cloudinary folder path
 */
const getCloudinaryFolder = (contentType) => {
  return CLOUDINARY_FOLDERS[contentType] || CLOUDINARY_FOLDERS.site;
};

/**
 * Validate if file format is allowed
 * @param {string} mimeType - The MIME type of the file
 * @returns {boolean} - True if format is allowed
 */
const isAllowedFormat = (mimeType) => {
  return ALLOWED_FORMATS.mimeTypes.includes(mimeType);
};

/**
 * Generate Cloudinary upload options
 * @param {string} contentType - The content type
 * @param {object} options - Additional options
 * @returns {object} - Cloudinary upload options
 */
const getUploadOptions = (contentType, options = {}) => {
  return {
    folder: getCloudinaryFolder(contentType),
    resource_type: 'auto',
    use_filename: false,
    unique_filename: true,
    overwrite: false,
    quality: 'auto',
    flags: 'progressive',
    // Strip metadata for privacy and performance
    flags: 'lossy',
    ...options,
  };
};

module.exports = {
  cloudinary,
  CLOUDINARY_FOLDERS,
  ALLOWED_FORMATS,
  OPTIMIZATION_SETTINGS,
  TRANSFORMATION_PRESETS,
  getCloudinaryFolder,
  isAllowedFormat,
  getUploadOptions,
};
