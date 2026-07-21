const Category = require('../models/Category');
const { slugify } = require('../utils/helpers');
const { uploadImage, deleteImage } = require('../services/uploadService');

exports.createCategory = async (req, res) => {
  try {
    const { description, parentCategory, name } = req.body;
    const season = req.body.season ? String(req.body.season).toLowerCase() : null;
    const sizes = req.body.sizes
      ? Array.isArray(req.body.sizes)
        ? req.body.sizes
        : String(req.body.sizes).split(',').map((item) => item.trim()).filter(Boolean)
      : [];
    const subcategoryNames = req.body.subcategoryNames
      ? Array.isArray(req.body.subcategoryNames)
        ? req.body.subcategoryNames
        : String(req.body.subcategoryNames).split(',').map((item) => item.trim()).filter(Boolean)
      : [];
    const isActive = req.body.isActive !== undefined
      ? String(req.body.isActive).toLowerCase() === 'true'
      : true;
    const seasonLabel = season ? season.charAt(0).toUpperCase() + season.slice(1) : 'Seasonal';
    const categoryName = name?.trim() || `${seasonLabel} (${new Date().toISOString().split('T')[0]})`;
    let slugValue = req.body.slug ? slugify(req.body.slug) : slugify(categoryName);

    if (!slugValue) {
      slugValue = `category-${Date.now()}`;
    }

    const existingCategory = await Category.findOne({ slug: slugValue }).lean();
    if (existingCategory) {
      slugValue = `${slugValue}-${Date.now()}`;
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadImage(req.file.path, 'categories', baseUrl);
    }

    const category = await Category.create({
      name: categoryName,
      slug: slugValue,
      description,
      image: imageUrl,
      season,
      sizes,
      subcategoryNames,
      parentCategory,
      isActive,
    });

    res.status(201).json({ success: true, message: 'Category created successfully', category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSubcategoriesBySeason = async (req, res) => {
  try {
    const season = String(req.params.season || '').trim().toLowerCase();

    if (!season) {
      return res.status(400).json({ success: false, message: 'Season is required' });
    }

    const categories = await Category.find({ isActive: true, season })
      .select('subcategoryNames')
      .lean();

    const subcategories = Array.from(
      new Map(
        categories
          .flatMap((category) => (category.subcategoryNames || []).filter(Boolean))
          .map((name) => {
            const label = String(name).trim();
            const slug = slugify(label);
            return [slug, { _id: slug, name: label, slug }];
          })
      ).values()
    );

    res.status(200).json({ success: true, subcategories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate('parentCategory')
      .sort('displayOrder');
    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parentCategory')
      .populate('subcategories');

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { description, displayOrder, name } = req.body;
    const season = req.body.season ? String(req.body.season).toLowerCase() : undefined;
    const sizes = req.body.sizes
      ? Array.isArray(req.body.sizes)
        ? req.body.sizes
        : String(req.body.sizes).split(',').map((item) => item.trim()).filter(Boolean)
      : undefined;
    const subcategoryNames = req.body.subcategoryNames
      ? Array.isArray(req.body.subcategoryNames)
        ? req.body.subcategoryNames
        : String(req.body.subcategoryNames).split(',').map((item) => item.trim()).filter(Boolean)
      : undefined;
    const isActive = req.body.isActive !== undefined
      ? String(req.body.isActive).toLowerCase() === 'true'
      : undefined;
    const slugValue = req.body.slug ? slugify(req.body.slug) : undefined;

    let category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (name) {
      category.name = name.trim();
    } else if (season) {
      category.season = season;
      category.name = `Season: ${season.charAt(0).toUpperCase() + season.slice(1)}`;
    }
    if (season) category.season = season;
    if (sizes !== undefined) category.sizes = sizes;
    if (subcategoryNames !== undefined) category.subcategoryNames = subcategoryNames;
    if (slugValue) category.slug = slugValue;
    if (description) category.description = description;
    if (displayOrder !== undefined) category.displayOrder = displayOrder;
    if (isActive !== undefined) category.isActive = isActive;

    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      if (category.image) {
        await deleteImage(category.image);
      }
      category.image = await uploadImage(req.file.path, 'categories', baseUrl);
    }

    category.updatedAt = Date.now();
    await category.save();

    res.status(200).json({ success: true, message: 'Category updated successfully', category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (category.image) {
      await deleteImage(category.image);
    }

    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
