const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      price: {
        type: Number,
        required: true,
      },
      size: String,
      color: String,
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  subtotal: Number,
  taxAmount: {
    type: Number,
    default: 0,
  },
  shippingCost: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    default: null,
  },
  shippingAddress: {
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  billingAddress: {
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  paymentMethod: {
    type: String,
    enum: ['bank_account', 'jazzcash', 'easypaisa', 'other_bank', 'stripe', 'paypal', 'bank_transfer', 'cash_on_delivery'],
    required: true,
  },
  paymentNumber: String,
  paymentReceipt: String,
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  trackingNumber: String,
  shippingCarrier: String,
  notes: String,
  adminNotes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

orderSchema.index({ user: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
