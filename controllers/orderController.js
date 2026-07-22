const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { generateOrderNumber, calculatePagination } = require('../utils/helpers');
const sendOrderEmail = require('../utils/sendOrderEmail');

const normalizeAddress = (address) => {
  if (!address || typeof address !== 'object') return {};

  const fullName = address.fullName ||
    [address.firstName, address.lastName].filter(Boolean).join(' ').trim();

  return {
    fullName,
    phone: address.phone || '',
    addressLine1: address.addressLine1 || address.address || '',
    addressLine2: address.addressLine2 || '',
    city: address.city || '',
    state: address.state || '',
    zipCode: address.zipCode || address.postalCode || '',
    country: address.country || '',
  };
};

exports.createOrder = async (req, res) => {
  try {
    let { items, shippingAddress, billingAddress, paymentMethod, paymentNumber, notes, coupon } = req.body;

    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (err) {
        return res.status(400).json({ success: false, message: 'Invalid items payload' });
      }
    }

    if (Array.isArray(items)) {
      items = items.map((item) => {
        if (item && typeof item === 'object') {
          const rawProduct = item.product;
          const productId =
            rawProduct && typeof rawProduct === 'object'
              ? rawProduct._id || rawProduct.id
              : rawProduct;
          return {
            ...item,
            product: productId,
            quantity: Number(item.quantity) || 0,
          };
        }
        return item;
      });
    }

    if (typeof shippingAddress === 'string') {
      try {
        shippingAddress = JSON.parse(shippingAddress);
      } catch (err) {
        return res.status(400).json({ success: false, message: 'Invalid shipping address payload' });
      }
    }

    if (typeof billingAddress === 'string') {
      try {
        billingAddress = JSON.parse(billingAddress);
      } catch (err) {
        billingAddress = null;
      }
    }

    shippingAddress = normalizeAddress(shippingAddress);
    billingAddress = normalizeAddress(billingAddress || shippingAddress);

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
      }

      totalAmount += product.price * item.quantity;
      product.stock -= item.quantity;
      await product.save();

      orderItems.push({
        product: item.product,
        quantity: item.quantity,
        price: product.price,
        size: item.size,
        color: item.color,
      });
    }

    const orderNumber = generateOrderNumber();

    const paymentReceipt = req.file ? `/uploads/${req.file.filename}` : undefined;

    const order = await Order.create({
      orderNumber,
      user: req.user._id,
      items: orderItems,
      totalAmount,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod,
      paymentNumber,
      paymentReceipt,
      notes,
      ...(coupon ? { coupon } : {}),
    });

    await Cart.findOneAndDelete({ user: req.user._id });

    try {
      await sendOrderEmail(order);
    } catch (emailError) {
      console.error('Order email failed:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { skip } = calculatePagination(page, limit);

    const orders = await Order.find({ user: req.user._id })
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('items.product');

    const total = await Order.countDocuments({ user: req.user._id });

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product')
      .populate('user')
      .populate('coupon');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.trackOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
      .populate('items.product')
      .populate('user');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const updateData = { updatedAt: Date.now() };

    if (orderStatus) {
      updateData.orderStatus = orderStatus;
    }

    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, message: 'Order status updated', order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, orderStatus } = req.query;
    const { skip } = calculatePagination(page, limit);

    let query = {};
    if (orderStatus) {
      query.orderStatus = orderStatus;
    }

    const orders = await Order.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user')
      .populate('items.product');

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
