const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const UPLOADS_DIR = path.join(__dirname, '../uploads');

const getRelativePathFromUrl = (urlPath) => {
  if (!urlPath) return null;

  try {
    const parsedUrl = new URL(urlPath, 'http://localhost');
    return parsedUrl.pathname;
  } catch {
    return urlPath;
  }
};

/**
 * Upload a single image file and return the URL path
 * @param {string} filePath - Full path to the uploaded file
 * @param {string} subfolder - Optional subfolder within uploads (e.g., 'products', 'banners')
 * @param {string} [baseUrl] - Optional absolute base URL for generated image URLs
 * @returns {string} - URL path for the uploaded file
 */
exports.uploadImage = async (filePath, subfolder = 'products', baseUrl) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Create target subfolder if it doesn't exist
    const targetFolder = path.join(UPLOADS_DIR, subfolder);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
      console.log(`📁 Created folder: ${targetFolder}`);
    }

    // Copy file to subfolder
    const filename = path.basename(filePath);
    const targetPath = path.join(targetFolder, filename);

    fs.copyFileSync(filePath, targetPath);
    console.log(`✅ File copied: ${filePath} → ${targetPath}`);

    // Remove temp file if it's different from target
    if (filePath !== targetPath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Temp file removed: ${filePath}`);
    }

    // Generate URL path - always use relative path
    const relativePath = `/uploads/${subfolder}/${filename}`;
    const urlPath = baseUrl ? `${baseUrl}${relativePath}` : relativePath;
    
    console.log(`🔗 Generated URL: ${urlPath}`);
    return urlPath;
  } catch (error) {
    console.error('❌ Upload error:', error && error.message);
    throw error;
  }
};

/**
 * Upload multiple images and return URL paths
 * @param {string[]} filePaths - Array of file paths
 * @param {string} subfolder - Optional subfolder within uploads
 * @param {string} [baseUrl] - Optional absolute base URL for generated image URLs
 * @returns {string[]} - Array of URL paths
 */
exports.uploadMultipleImages = async (filePaths, subfolder = 'products', baseUrl) => {
  try {
    const urls = [];

    // Ensure subfolder exists
    const targetFolder = path.join(UPLOADS_DIR, subfolder);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
      console.log(`📁 Created folder: ${targetFolder}`);
    }

    for (const filePath of filePaths) {
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Warning: File not found: ${filePath}`);
        continue;
      }

      try {
        const filename = path.basename(filePath);
        const targetPath = path.join(targetFolder, filename);

        // Copy file to subfolder
        fs.copyFileSync(filePath, targetPath);
        console.log(`✅ File copied: ${filePath} → ${targetPath}`);

        // Remove temp file if it's different from target
        if (filePath !== targetPath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Temp file removed: ${filePath}`);
        }

        // Generate URL - always use relative path
        const relativePath = `/uploads/${subfolder}/${filename}`;
        const urlPath = baseUrl ? `${baseUrl}${relativePath}` : relativePath;
        urls.push(urlPath);
        console.log(`🔗 Generated URL: ${urlPath}`);
      } catch (fileError) {
        console.warn(`⚠️ Error processing file ${filePath}:`, fileError.message);
        continue;
      }
    }

    console.log(`✅ Total images uploaded: ${urls.length}`);
    return urls;
  } catch (error) {
    console.error('❌ Multiple upload error:', error && error.message);
    throw error;
  }
};

/**
 * Delete an image file from the uploads folder
 * @param {string} urlPath - Relative or absolute URL path (e.g., '/uploads/products/file.png' or 'http://localhost:5000/uploads/products/file.png')
 */
exports.deleteImage = async (urlPath) => {
  try {
    if (!urlPath) return;

    const relativePath = getRelativePathFromUrl(urlPath);
    const filePath = path.join(__dirname, '..', relativePath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`File deleted: ${relativePath}`);
    }
  } catch (error) {
    console.warn('Delete error:', error && error.message);
  }
};

/**
 * Get the full file system path from a URL path
 * @param {string} urlPath - Relative URL path
 * @returns {string} - Full file system path
 */
exports.getFilePath = (urlPath) => {
  const relativePath = getRelativePathFromUrl(urlPath);
  return path.join(__dirname, '..', relativePath);
};
