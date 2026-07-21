const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  description: String,
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0,
  },
  maxDiscount: {
    type: Number,
    default: null,
  },
  minPurchase: {
    type: Number,
    default: 0,
  },
  maxUses: {
    type: Number,
    default: null,
  },
  currentUses: {
    type: Number,
    default: 0,
  },
  usedBy: [
    {
      user: mongoose.Schema.Types.ObjectId,
      usedAt: Date,
    },
  ],
  applicableCategories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
  ],
  applicableProducts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
  ],
  startDate: Date,
  expiryDate: Date,
  isActive: {
    type: Boolean,
    default: true,
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

module.exports = mongoose.model('Coupon', couponSchema);
