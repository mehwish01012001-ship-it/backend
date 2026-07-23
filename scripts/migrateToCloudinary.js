/**
 * Migration Utility for Local Uploads to Cloudinary
 * 
 * This utility migrates existing image URLs from local storage (/uploads/...)
 * to Cloudinary and updates the MongoDB database accordingly.
 * 
 * Usage:
 *   node scripts/migrateToCloudinary.js
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('../models/Product');
const Category = require('../models/Category');
const HeroSliderSlide = require('../models/HeroSliderSlide');
const User = require('../models/User');
const { uploadSingleImage, validateCloudinaryConfig } = require('../services/cloudinaryService');
const { connectDB } = require('../config/database');

const uploadsDir = path.join(__dirname, '../uploads');

/**
 * Get list of all local files in uploads directory
 */
const getLocalFiles = () => {
  const files = [];

  const walkDir = (dir) => {
    if (!fs.existsSync(dir)) return;

    fs.readdirSync(dir).forEach((file) => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else {
        const relativePath = path.relative(uploadsDir, fullPath);
        const folder = relativePath.split(path.sep)[0];
        files.push({ path: fullPath, relativePath, folder });
      }
    });
  };

  walkDir(dir);
  return files;
};

/**
 * Upload a local file to Cloudinary
 */
const uploadLocalFileToCloudinary = async (filePath, contentType) => {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ File not found: ${filePath}`);
      return null;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const uploadResult = await uploadSingleImage(fileBuffer, contentType);
    return uploadResult;
  } catch (error) {
    console.error(`❌ Error uploading ${filePath}:`, error.message);
    return null;
  }
};

/**
 * Migrate product images
 */
const migrateProducts = async () => {
  console.log('\n📦 Migrating products...');

  try {
    const products = await Product.find({ images: { $exists: true, $ne: [] } });
    let migrated = 0;
    let failed = 0;

    for (const product of products) {
      const newImages = [];

      for (const image of product.images) {
        if (image.publicId) {
          // Already migrated
          newImages.push(image);
          continue;
        }

        // Image has URL but no publicId - need to migrate
        if (image.url && image.url.includes('/uploads/')) {
          // Extract local path from URL
          const localPath = path.join(uploadsDir, image.url.split('/uploads/')[1]);
          const uploadResult = await uploadLocalFileToCloudinary(localPath, 'products');

          if (uploadResult) {
            newImages.push({
              url: uploadResult.url,
              publicId: uploadResult.publicId,
              alt: image.alt || '',
            });
            migrated++;
          } else {
            // Keep original if migration fails
            newImages.push(image);
            failed++;
          }
        } else {
          newImages.push(image);
        }
      }

      product.images = newImages;
      await product.save();
    }

    console.log(`✅ Products migrated: ${migrated}, Failed: ${failed}`);
  } catch (error) {
    console.error('❌ Error migrating products:', error.message);
  }
};

/**
 * Migrate category images
 */
const migrateCategories = async () => {
  console.log('\n🏷️ Migrating categories...');

  try {
    const categories = await Category.find({});
    let migrated = 0;
    let failed = 0;

    for (const category of categories) {
      let updated = false;

      // Migrate image
      if (category.image && !category.imagePublicId && category.image.includes('/uploads/')) {
        const localPath = path.join(uploadsDir, category.image.split('/uploads/')[1]);
        const uploadResult = await uploadLocalFileToCloudinary(localPath, 'categories');

        if (uploadResult) {
          category.image = uploadResult.url;
          category.imagePublicId = uploadResult.publicId;
          migrated++;
          updated = true;
        } else {
          failed++;
        }
      }

      // Migrate icon
      if (category.icon && !category.iconPublicId && category.icon.includes('/uploads/')) {
        const localPath = path.join(uploadsDir, category.icon.split('/uploads/')[1]);
        const uploadResult = await uploadLocalFileToCloudinary(localPath, 'categories');

        if (uploadResult) {
          category.icon = uploadResult.url;
          category.iconPublicId = uploadResult.publicId;
          migrated++;
          updated = true;
        } else {
          failed++;
        }
      }

      if (updated) {
        await category.save();
      }
    }

    console.log(`✅ Categories migrated: ${migrated}, Failed: ${failed}`);
  } catch (error) {
    console.error('❌ Error migrating categories:', error.message);
  }
};

/**
 * Migrate hero slider images
 */
const migrateHeroSlider = async () => {
  console.log('\n🎬 Migrating hero slider...');

  try {
    const slides = await HeroSliderSlide.find({});
    let migrated = 0;
    let failed = 0;

    for (const slide of slides) {
      if (slide.image && !slide.imagePublicId && slide.image.includes('/uploads/')) {
        const localPath = path.join(uploadsDir, slide.image.split('/uploads/')[1]);
        const uploadResult = await uploadLocalFileToCloudinary(localPath, 'hero-slider');

        if (uploadResult) {
          slide.image = uploadResult.url;
          slide.imagePublicId = uploadResult.publicId;
          migrated++;
          await slide.save();
        } else {
          failed++;
        }
      }
    }

    console.log(`✅ Hero slides migrated: ${migrated}, Failed: ${failed}`);
  } catch (error) {
    console.error('❌ Error migrating hero slider:', error.message);
  }
};

/**
 * Migrate user avatars
 */
const migrateUsers = async () => {
  console.log('\n👤 Migrating user avatars...');

  try {
    const users = await User.find({ avatar: { $exists: true, $ne: null } });
    let migrated = 0;
    let failed = 0;

    for (const user of users) {
      if (user.avatar && !user.avatarPublicId && user.avatar.includes('/uploads/')) {
        const localPath = path.join(uploadsDir, user.avatar.split('/uploads/')[1]);
        const uploadResult = await uploadLocalFileToCloudinary(localPath, 'users');

        if (uploadResult) {
          user.avatar = uploadResult.url;
          user.avatarPublicId = uploadResult.publicId;
          migrated++;
          await user.save();
        } else {
          failed++;
        }
      }
    }

    console.log(`✅ User avatars migrated: ${migrated}, Failed: ${failed}`);
  } catch (error) {
    console.error('❌ Error migrating user avatars:', error.message);
  }
};

/**
 * Main migration function
 */
const runMigration = async () => {
  console.log('🚀 Starting migration from local uploads to Cloudinary...\n');

  // Validate Cloudinary config
  if (!validateCloudinaryConfig()) {
    console.error('❌ Cloudinary configuration is incomplete. Please set environment variables.');
    process.exit(1);
  }

  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Get local files info
    const localFiles = getLocalFiles();
    console.log(`📊 Found ${localFiles.length} files in local uploads directory`);

    // Migrate each collection
    await migrateProducts();
    await migrateCategories();
    await migrateHeroSlider();
    await migrateUsers();

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Verify all images in MongoDB have Cloudinary URLs');
    console.log('2. Test image loading on frontend');
    console.log('3. Once verified, you can delete the backend/uploads directory');
    console.log('4. Remove old upload service from your code\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
runMigration();
