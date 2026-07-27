const Product = require('../models/Product');
const Category = require('../models/Category');
const { slugify, calculatePagination } = require('../utils/helpers');
const { uploadSingleImage, uploadMultipleImages, deleteImage, deleteMultipleImages } = require('../services/cloudinaryService');

const parseArrayField = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];

  const trimmed = value.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed;
  } catch (err) {
    // not JSON, fall back to comma-separated values
  }

  return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
};

const parseColorField = (value) => {
  const rawColors = parseArrayField(value);
  if (!Array.isArray(rawColors)) return [];

  return rawColors
    .map((color) => {
      if (typeof color === 'object' && color !== null) {
        return {
          name: String(color.name || color.value || color.label || '').trim(),
          code: String(color.code || '').trim(),
        };
      }

      const name = String(color).trim();
      return { name, code: '' };
    })
    .filter((color) => color.name);
};

const normalizeBoolean = (value) => value === 'true' || value === true;

const isVideoMimeType = (mimeType) => typeof mimeType === 'string' && mimeType.startsWith('video/');

const createMediaEntry = ({ url, publicId = '', alt = '', type = 'video', source = 'external' }) => ({
  url,
  publicId,
  alt,
  type,
  source,
});

const getCollectionTypeFlags = (productType, fallbackFlags = {}) => {
  const normalizedType = String(productType ?? '').trim().toLowerCase();

  if (!normalizedType) {
    return {
      isFlashSale: normalizeBoolean(fallbackFlags.isFlashSale),
      isNewArrival: normalizeBoolean(fallbackFlags.isNewArrival),
      isBestSeller: normalizeBoolean(fallbackFlags.isBestSeller),
      isTrending: normalizeBoolean(fallbackFlags.isTrending),
    };
  }

  const typeMap = {
    'flash-sale': { isFlashSale: true },
    flash: { isFlashSale: true },
    'new-arrival': { isNewArrival: true },
    new: { isNewArrival: true },
    'trending-products': { isTrending: true },
    trending: { isTrending: true },
    'best-seller': { isBestSeller: true },
    best: { isBestSeller: true },
    'best-sellers': { isBestSeller: true },
  };

  const selectedFlags = typeMap[normalizedType] || {};

  return {
    isFlashSale: false,
    isNewArrival: false,
    isBestSeller: false,
    isTrending: false,
    ...selectedFlags,
  };
};

const escapeRegExp = (string) => String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const serializeProduct = (product) => {
  if (!product) return product;

  const plainProduct = product.toObject ? product.toObject() : product;

  return {
    ...plainProduct,
    isFlash: plainProduct.isFlashSale ?? plainProduct.isFlash ?? false,
    isNew: plainProduct.isNewArrival ?? plainProduct.isNew ?? false,
  };
};

exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      comparePrice,
      category,
      subcategory,
      sku,
      stock,
      sizes,
      colors,
      material,
      brand,
      tags,
      isFeatured,
      isFlash,
      isNew,
      isBestSeller,
      isTrending,
      isLimitedAddition,
      isActive,
      launchDate,
      productLink,
      seoTitle,
      seoDescription,
      seoKeywords,
      productType,
    } = req.body;

    const collectionFlags = getCollectionTypeFlags(productType, {
      isFlashSale: isFlash,
      isNewArrival: isNew,
      isBestSeller,
      isTrending,
    });

    console.log('📦 Creating product:', { name, sku, price, productType });
    console.log('📤 Files received:', req.files?.length || 0, 'file(s)');

    let product = await Product.findOne({ sku });
    if (product) {
      console.log('❌ SKU already exists:', sku);
      return res.status(400).json({ success: false, message: 'SKU already exists' });
    }

    const imageUrls = [];
    const mediaItems = [];
    const externalVideoUrl = String(req.body.videoUrl || '').trim();

    if (req.files && Array.isArray(req.files.images) && req.files.images.length > 0) {
      console.log('🖼️ Processing images:', req.files.images.length, 'file(s)');
      try {
        const uploadedImages = await uploadMultipleImages(
          req.files.images.map((f) => f.buffer),
          'products'
        );
        console.log('✅ Images uploaded to Cloudinary:', uploadedImages.length);

        uploadedImages.forEach((img, index) => {
          const file = req.files.images[index];
          const isVideo = isVideoMimeType(file.mimetype);
          const item = {
            url: img.url,
            publicId: img.publicId,
            alt: '',
          };

          if (isVideo) {
            mediaItems.push(createMediaEntry({
              url: img.url,
              publicId: img.publicId,
              alt: '',
              type: 'video',
              source: 'cloudinary',
            }));
          } else {
            imageUrls.push(item);
          }
        });
      } catch (uploadError) {
        console.error('❌ Image upload failed:', uploadError.message);
        return res.status(400).json({
          success: false,
          message: `Failed to upload images: ${uploadError.message}`,
        });
      }
    } else {
      console.log('⚠️ No images received with product creation');
    }

    if (req.files && Array.isArray(req.files.video) && req.files.video.length > 0) {
      try {
        console.log('🎬 Uploading dedicated video file');
        const uploadedVideo = await uploadSingleImage(req.files.video[0].buffer, 'products', { resource_type: 'auto' });
        mediaItems.push(createMediaEntry({
          url: uploadedVideo.url,
          publicId: uploadedVideo.publicId,
          alt: '',
          type: 'video',
          source: 'cloudinary',
        }));
      } catch (uploadError) {
        console.error('❌ Video upload failed:', uploadError.message);
        return res.status(400).json({
          success: false,
          message: `Failed to upload video: ${uploadError.message}`,
        });
      }
    }

    if (externalVideoUrl) {
      mediaItems.push(createMediaEntry({
        url: externalVideoUrl,
        type: 'video',
        source: 'external',
      }));
    }

    product = await Product.create({
      name,
      slug: slugify(name),
      description,
      price,
      comparePrice,
      category,
      subcategory,
      sku,
      stock,
      images: imageUrls,
      media: mediaItems,
      videoUrl: externalVideoUrl,
      sizes: parseArrayField(sizes),
      material,
      brand,
      isFlashSale: collectionFlags.isFlashSale,
      isNewArrival: collectionFlags.isNewArrival,
      isBestSeller: collectionFlags.isBestSeller,
      isTrending: collectionFlags.isTrending,
      isLimitedAddition: normalizeBoolean(isLimitedAddition),
      tags: parseArrayField(tags),
      isFeatured: normalizeBoolean(isFeatured),
      isActive: normalizeBoolean(isActive),
      launchDate: launchDate ? new Date(launchDate) : null,
      productLink,
      seoTitle,
      seoDescription,
      seoKeywords: parseArrayField(seoKeywords),
      colors: parseColorField(colors),
    });

    console.log('✅ Product created successfully:', product._id);

    res.status(201).json({ success: true, message: 'Product created successfully', product: serializeProduct(product) });
  } catch (error) {
    console.error('❌ Error creating product:', error.message);
    console.error('📋 Stack:', error.stack);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 12, category, season, search, sortBy = '-createdAt', includeInactive, minPrice, maxPrice } = req.query;
    const { skip } = calculatePagination(page, limit);

    const includeInactiveProducts = includeInactive === 'true' || includeInactive === true || includeInactive === 1;
    let query = {};

    if (!includeInactiveProducts) {
      query.isActive = true;
    }

    // if explicit category id passed, filter by it
    if (category) {
      // support values like "<categoryId>-<subcategory-slug>" coming from frontend
      if (typeof category === 'string' && category.includes('-')) {
        const dashIndex = category.indexOf('-');
        const possibleId = category.substring(0, dashIndex);
        const rest = category.substring(dashIndex + 1);
        // validate ObjectId length (24 hex chars) before casting
        if (/^[0-9a-fA-F]{24}$/.test(possibleId)) {
          query.category = possibleId;
          if (rest) {
            // match subcategory loosely (slug or label)
            query.subcategory = { $regex: rest.replace(/[-_]+/g, " "), $options: 'i' };
          }
        } else {
          // fallback: treat whole value as category slug/name
          query.category = category;
        }
      } else {
        query.category = category;
      }
    }

    // if season selected, restrict to categories for that season
    if (season && !category) {
      const seasonCategories = await Category.find({
        season: { $regex: `^${season}$`, $options: 'i' },
      }).select('_id');
      const seasonIds = seasonCategories.map((cat) => cat._id);
      if (seasonIds.length > 0) {
        query.category = { $in: seasonIds };
      } else {
        query.category = { $in: [] };
      }
    }

    const min = Number(minPrice);
    const max = Number(maxPrice);
    // size filter: match when product.sizes contains the requested size
    if (req.query.size) {
      const sizeVal = String(req.query.size).trim();
      if (sizeVal) {
        query.sizes = {
          $in: [sizeVal],
        };
      }
    }

    if (!Number.isNaN(min) && min >= 0) {
      query.price = { ...(query.price || {}), $gte: min };
    }

    if (!Number.isNaN(max) && max >= 0) {
      query.price = { ...(query.price || {}), $lte: max };
    }

    // text search
    if (search) {
      query.$text = { $search: search };
    }

    const products = await Product.find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('category');

    const serializedProducts = products.map(serializeProduct);

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      products: serializedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).populate('category');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      comparePrice,
      category,
      subcategory,
      sku,
      stock,
      sizes,
      colors,
      isFlash,
      isNew,
      isBestSeller,
      isTrending,
      isLimitedAddition,
      material,
      brand,
      tags,
      isFeatured,
      isActive,
      launchDate,
      productLink,
      productType,
    } = req.body;

    let product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const collectionFlags = getCollectionTypeFlags(productType, {
      isFlashSale: isFlash,
      isNewArrival: isNew,
      isBestSeller,
      isTrending,
    });

    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = price;
    if (comparePrice) product.comparePrice = comparePrice;
    if (category) product.category = category;
    if (subcategory !== undefined) product.subcategory = subcategory;
    if (sku) product.sku = sku;
    if (stock !== undefined) product.stock = stock;
    if (sizes) product.sizes = parseArrayField(sizes);
    if (productType !== undefined || isFlash !== undefined || isNew !== undefined || isBestSeller !== undefined || isTrending !== undefined) {
      product.isFlashSale = collectionFlags.isFlashSale;
      product.isNewArrival = collectionFlags.isNewArrival;
      product.isBestSeller = collectionFlags.isBestSeller;
      product.isTrending = collectionFlags.isTrending;
    }
    if (isLimitedAddition !== undefined) product.isLimitedAddition = normalizeBoolean(isLimitedAddition);
    if (colors) product.colors = parseColorField(colors);
    if (material) product.material = material;
    if (brand) product.brand = brand;
    if (tags) product.tags = parseArrayField(tags);
    if (isFeatured !== undefined) product.isFeatured = normalizeBoolean(isFeatured);
    if (isActive !== undefined) product.isActive = normalizeBoolean(isActive);
    if (launchDate !== undefined) product.launchDate = launchDate ? new Date(launchDate) : null;
    if (productLink !== undefined) product.productLink = productLink;

    // Handle new image uploads
    if (req.files && Array.isArray(req.files.images) && req.files.images.length > 0) {
      try {
        const uploadedImages = await uploadMultipleImages(
          req.files.images.map((f) => f.buffer),
          'products'
        );
        product.images.push(
          ...uploadedImages.map((img, index) => {
            const file = req.files.images[index];
            const isVideo = isVideoMimeType(file.mimetype);
            if (isVideo) {
              product.media = product.media || [];
              product.media.push(createMediaEntry({
                url: img.url,
                publicId: img.publicId,
                alt: '',
                type: 'video',
                source: 'cloudinary',
              }));
              return null;
            }

            return {
              url: img.url,
              publicId: img.publicId,
              alt: '',
            };
          }).filter(Boolean)
        );
      } catch (uploadError) {
        console.error('❌ Failed to upload new images:', uploadError.message);
        return res.status(400).json({
          success: false,
          message: `Failed to upload images: ${uploadError.message}`,
        });
      }
    }

    const externalVideoUrl = String(req.body.videoUrl || '').trim();
    const existingVideo = String(req.body.existingVideo || '').trim();

    if (req.files && Array.isArray(req.files.video) && req.files.video.length > 0) {
      try {
        const uploadedVideo = await uploadSingleImage(req.files.video[0].buffer, 'products', { resource_type: 'auto' });
        product.media = product.media || [];

        const replacedVideo = product.media.find((item) => item.url === existingVideo && item.type === 'video' && item.source === 'cloudinary');
        if (replacedVideo && replacedVideo.publicId) {
          await deleteImage(replacedVideo.publicId).catch((deleteErr) => {
            console.warn('⚠️ Failed to delete replaced video from Cloudinary:', deleteErr.message);
          });
        }

        product.media = product.media.filter((item) => item.url !== existingVideo);
        product.media.push(createMediaEntry({
          url: uploadedVideo.url,
          publicId: uploadedVideo.publicId,
          alt: '',
          type: 'video',
          source: 'cloudinary',
        }));
      } catch (uploadError) {
        console.error('❌ Failed to upload new video:', uploadError.message);
        return res.status(400).json({
          success: false,
          message: `Failed to upload video: ${uploadError.message}`,
        });
      }
    } else if (externalVideoUrl) {
      product.media = product.media || [];
      // Keep only one external video entry for the dedicated video field
      product.media = product.media.filter((item) => item.type !== 'video' || item.source !== 'external');
      product.media.push(createMediaEntry({
        url: externalVideoUrl,
        type: 'video',
        source: 'external',
      }));
    } else if (existingVideo === '') {
      product.media = (product.media || []).filter((item) => item.type !== 'video' || item.source !== 'external');
    }

    if (externalVideoUrl !== undefined) {
      product.videoUrl = externalVideoUrl;
    }

    // Handle image deletion - keep only images in existingImages array
    if (req.body.existingImages) {
      try {
        const keep = Array.isArray(req.body.existingImages)
          ? req.body.existingImages
          : JSON.parse(req.body.existingImages);

        const toRemove = product.images.filter((img) => !keep.includes(img.url));

        if (toRemove.length > 0) {
          const publicIdsToDelete = toRemove
            .filter((img) => img.publicId)
            .map((img) => img.publicId);

          if (publicIdsToDelete.length > 0) {
            await deleteMultipleImages(publicIdsToDelete);
          }
        }

        product.images = product.images.filter((img) => keep.includes(img.url));
      } catch (e) {
        console.warn('Could not parse existingImages', e.message || e);
      }
    }

    product.updatedAt = Date.now();
    await product.save();

    res.status(200).json({ success: true, message: 'Product updated successfully', product: serializeProduct(product) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Delete all product images and cloudinary media from Cloudinary
    const imagePublicIds = (product.images || [])
      .filter((img) => img.publicId)
      .map((img) => img.publicId);

    const mediaPublicIds = (product.media || [])
      .filter((item) => item.source === 'cloudinary' && item.publicId)
      .map((item) => item.publicId);

    const publicIds = [...new Set([...imagePublicIds, ...mediaPublicIds])];

    if (publicIds.length > 0) {
      try {
        await deleteMultipleImages(publicIds);
      } catch (error) {
        console.error('⚠️ Failed to delete some media from Cloudinary:', error.message);
        // Continue with deletion even if media deletion fails
      }
    }

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFeaturedProducts = async (req, res) => {
  try {
    // Check database connection
    if (Product && Product.db && Product.db.readyState !== 1) {
      console.warn('⚠️ Database not connected for featured products query');
      return res.status(200).json({ success: true, products: [] });
    }

    const products = await Product.find({ isFeatured: true, isActive: true }).limit(8).populate('category');
    res.status(200).json({ success: true, products: products.map(serializeProduct) });
  } catch (error) {
    console.error('❌ Error fetching featured products:', error.message);
    console.error('📋 Stack:', error.stack);
    // Return empty array instead of 500 error for graceful degradation
    res.status(200).json({ success: true, products: [] });
  }
};

exports.getFlashSaleProducts = async (req, res) => {
  try {
    // Check database connection
    if (Product && Product.db && Product.db.readyState !== 1) {
      console.warn('⚠️ Database not connected for flash-sale query');
      return res.status(200).json({ success: true, products: [] });
    }

    const limit = Math.min(parseInt(req.query.limit) || 10, 24);
    const products = await Product.find({ isFlashSale: true, isActive: true })
      .sort('-createdAt')
      .limit(limit)
      .populate('category');

    res.status(200).json({ success: true, products: products.map(serializeProduct) });
  } catch (error) {
    console.error('❌ Error fetching flash-sale products:', error.message);
    console.error('📋 Stack:', error.stack);
    // Return empty array instead of 500 error for graceful degradation
    res.status(200).json({ success: true, products: [] });
  }
};

exports.getBestSellerProducts = async (req, res) => {
  try {
    // Check database connection
    if (Product && Product.db && Product.db.readyState !== 1) {
      console.warn('⚠️ Database not connected for best-sellers query');
      return res.status(200).json({ success: true, products: [] });
    }

    const limit = Math.min(parseInt(req.query.limit) || 8, 24);
    const products = await Product.find({ isBestSeller: true, isActive: true })
      .sort('-createdAt')
      .limit(limit)
      .populate('category');

    res.status(200).json({ success: true, products: products.map(serializeProduct) });
  } catch (error) {
    console.error('❌ Error fetching best-seller products:', error.message);
    console.error('📋 Stack:', error.stack);
    // Return empty array instead of 500 error for graceful degradation
    res.status(200).json({ success: true, products: [] });
  }
};

exports.getTrendingProducts = async (req, res) => {
  try {
    if (Product && Product.db && Product.db.readyState !== 1) {
      return res.status(200).json({ success: true, products: [] });
    }

    const limit = Math.min(parseInt(req.query.limit) || 12, 24);
    const products = await Product.find({
      isTrending: true,
      isActive: true,
    })
      .sort('-createdAt')
      .limit(limit)
      .populate('category');

    res.status(200).json({ success: true, products: products.map(serializeProduct) });
  } catch (error) {
    console.warn('⚠️ Trending products query failed:', error.message);
    res.status(200).json({ success: true, products: [] });
  }
};

exports.getNewArrivals = async (req, res) => {
  try {
    // Check database connection
    if (Product && Product.db && Product.db.readyState !== 1) {
      console.warn('⚠️ Database not connected for new-arrivals query');
      return res.status(200).json({ success: true, products: [] });
    }

    const limit = Math.min(parseInt(req.query.limit) || 12, 24);
    const products = await Product.find({
      $or: [{ isNewArrival: true }, { isNew: true }],
      isActive: true,
    })
      .sort('-createdAt')
      .limit(limit)
      .populate('category');
    res.status(200).json({ success: true, products: products.map(serializeProduct) });
  } catch (error) {
    console.error('❌ Error fetching new-arrival products:', error.message);
    console.error('📋 Stack:', error.stack);
    // Return empty array instead of 500 error for graceful degradation
    res.status(200).json({ success: true, products: [] });
  }
};
