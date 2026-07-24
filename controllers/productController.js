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
      isActive,
      launchDate,
      productLink,
      seoTitle,
      seoDescription,
      seoKeywords,
    } = req.body;

    console.log('📦 Creating product:', { name, sku, price });
    console.log('📤 Files received:', req.files?.length || 0, 'file(s)');

    let product = await Product.findOne({ sku });
    if (product) {
      console.log('❌ SKU already exists:', sku);
      return res.status(400).json({ success: false, message: 'SKU already exists' });
    }

    const imageUrls = [];
    
    if (req.files && req.files.length > 0) {
      console.log('🖼️ Processing images:', req.files.length, 'file(s)');
      try {
        // Upload images to Cloudinary
        const uploadedImages = await uploadMultipleImages(
          req.files.map(f => f.buffer),
          'products'
        );
        console.log('✅ Images uploaded to Cloudinary:', uploadedImages.length);
        imageUrls.push(...uploadedImages.map((img) => ({ 
          url: img.url, 
          publicId: img.publicId,
          alt: '' 
        })));
      } catch (uploadError) {
        console.error('❌ Image upload failed:', uploadError.message);
        return res.status(400).json({ 
          success: false, 
          message: `Failed to upload images: ${uploadError.message}` 
        });
      }
    } else {
      console.log('⚠️ No images received with product creation');
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
      sizes: parseArrayField(sizes),
      material,
      brand,
      isFlashSale: normalizeBoolean(isFlash),
      isNewArrival: normalizeBoolean(isNew),
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
      query.category = category;
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
      material,
      brand,
      tags,
      isFeatured,
      isActive,
      launchDate,
      productLink,
    } = req.body;

    let product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = price;
    if (comparePrice) product.comparePrice = comparePrice;
    if (category) product.category = category;
    if (subcategory !== undefined) product.subcategory = subcategory;
    if (sku) product.sku = sku;
    if (stock !== undefined) product.stock = stock;
    if (sizes) product.sizes = parseArrayField(sizes);
    if (isFlash !== undefined) product.isFlashSale = normalizeBoolean(isFlash);
    if (isNew !== undefined) product.isNewArrival = normalizeBoolean(isNew);
    if (colors) product.colors = parseColorField(colors);
    if (material) product.material = material;
    if (brand) product.brand = brand;
    if (tags) product.tags = parseArrayField(tags);
    if (isFeatured !== undefined) product.isFeatured = normalizeBoolean(isFeatured);
    if (isActive !== undefined) product.isActive = normalizeBoolean(isActive);
    if (launchDate !== undefined) product.launchDate = launchDate ? new Date(launchDate) : null;
    if (productLink !== undefined) product.productLink = productLink;

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      try {
        const uploadedImages = await uploadMultipleImages(
          req.files.map(f => f.buffer),
          'products'
        );
        product.images.push(...uploadedImages.map((img) => ({ 
          url: img.url,
          publicId: img.publicId,
          alt: '' 
        })));
      } catch (uploadError) {
        console.error('❌ Failed to upload new images:', uploadError.message);
        return res.status(400).json({ 
          success: false, 
          message: `Failed to upload images: ${uploadError.message}` 
        });
      }
    }

    // Handle image deletion - keep only images in existingImages array
    if (req.body.existingImages) {
      try {
        const keep = Array.isArray(req.body.existingImages) 
          ? req.body.existingImages 
          : JSON.parse(req.body.existingImages);
        
        const toRemove = product.images.filter((img) => !keep.includes(img.url));
        
        // Delete removed images from Cloudinary
        if (toRemove.length > 0) {
          const publicIdsToDelete = toRemove
            .filter(img => img.publicId)
            .map(img => img.publicId);
          
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

    // Delete all product images from Cloudinary
    if (product.images && product.images.length > 0) {
      const publicIds = product.images
        .filter(img => img.publicId)
        .map(img => img.publicId);
      
      if (publicIds.length > 0) {
        try {
          await deleteMultipleImages(publicIds);
        } catch (error) {
          console.error('⚠️ Failed to delete some images from Cloudinary:', error.message);
          // Continue with deletion even if image deletion fails
        }
      }
    }

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: true }).limit(8).populate('category');
    res.status(200).json({ success: true, products: products.map(serializeProduct) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getNewArrivals = async (req, res) => {
  try {
    const products = await Product.find({
      $or: [{ isNewArrival: true }, { isNew: true }],
      isActive: true,
    })
      .sort('-createdAt')
      .limit(12)
      .populate('category');
    res.status(200).json({ success: true, products: products.map(serializeProduct) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
