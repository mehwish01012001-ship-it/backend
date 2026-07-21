const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
  },
  shortDescription: String,
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: 0,
  },
  comparePrice: {
    type: Number,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  subcategory: {
    type: String,
    trim: true,
    default: '',
  },
  sku: {
    type: String,
    unique: true,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
  },
  images: [
    {
      url: String,
      alt: String,
    },
  ],
  sizes: [String],
  colors: [
    {
      name: String,
      code: String,
    },
  ],
  material: String,
  brand: String,
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  tags: [String],
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isFlashSale: {
    type: Boolean,
    default: false,
  },
  isNewArrival: {
    type: Boolean,
    default: false,
  },
  launchDate: {
    type: Date,
    default: null,
  },
  productLink: String,
  isActive: {
    type: Boolean,
    default: true,
  },
  seoTitle: String,
  seoDescription: String,
  seoKeywords: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1 });

module.exports = mongoose.model('Product', productSchema);
