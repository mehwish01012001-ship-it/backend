const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  description: String,
  image: String,
  season: {
    type: String,
    enum: ['summer', 'winter'],
  },
  sizes: [String],
  subcategoryNames: [String],
  icon: String,
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  subcategories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
  ],
  seoTitle: String,
  seoDescription: String,
  seoKeywords: [String],
  isActive: {
    type: Boolean,
    default: true,
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

categorySchema.index({ season: 1 });

module.exports = mongoose.model('Category', categorySchema);
