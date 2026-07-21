const Coupon = require('../models/Coupon');
const { calculatePagination } = require('../utils/helpers');

exports.createCoupon = async (req, res) => {
  try {
    const { code, description, discountType, discountValue, minPurchase, maxUses, startDate, expiryDate } = req.body;

    let coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (coupon) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    coupon = await Coupon.create({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minPurchase,
      maxUses,
      startDate,
      expiryDate,
    });

    res.status(201).json({ success: true, message: 'Coupon created successfully', coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.validateCoupon = async (req, res) => {
  try {
    const { code, amount } = req.body;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }

    if (coupon.startDate && new Date() < coupon.startDate) {
      return res.status(400).json({ success: false, message: 'Coupon is not yet active' });
    }

    if (coupon.expiryDate && new Date() > coupon.expiryDate) {
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    }

    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return res.status(400).json({ success: false, message: 'Coupon has reached maximum uses' });
    }

    if (amount < coupon.minPurchase) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase amount is ${coupon.minPurchase}`,
      });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (amount * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.discountValue;
    }

    res.status(200).json({
      success: true,
      coupon,
      discount,
      finalAmount: amount - discount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { skip } = calculatePagination(page, limit);

    const coupons = await Coupon.find()
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Coupon.countDocuments();

    res.status(200).json({
      success: true,
      coupons,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalCoupons: total,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
