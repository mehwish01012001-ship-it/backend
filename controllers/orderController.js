const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { generateOrderNumber, calculatePagination } = require('../utils/helpers');
const sendOrderEmail = require('../utils/sendOrderEmail');
const { sendOrderConfirmationEmail } = require('../services/emailService');

const normalizeAddress = (address) => {
  if (!address || typeof address !== 'object') return {};

  const fullName =
    address.fullName ||
    [address.firstName, address.lastName].filter(Boolean).join(' ').trim();

  return {
    fullName,
    email: address.email || '',
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
    let {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      paymentNumber,
      notes,
      coupon,
    } = req.body;

    // Parse items if sent as JSON string
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid items payload',
        });
      }
    }

    // Normalize items
    if (Array.isArray(items)) {
      items = items.map((item) => {
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
      });
    }

    // Parse shipping address
    if (typeof shippingAddress === 'string') {
      try {
        shippingAddress = JSON.parse(shippingAddress);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid shipping address',
        });
      }
    }

    // Parse billing address
    if (typeof billingAddress === 'string') {
      try {
        billingAddress = JSON.parse(billingAddress);
      } catch {
        billingAddress = null;
      }
    }

    shippingAddress = normalizeAddress(shippingAddress);
    billingAddress = normalizeAddress(billingAddress || shippingAddress);

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty',
      });
    }

    // Group quantities per product
    const quantityByProduct = items.reduce((map, item) => {
      const productId = String(item.product);
      const quantity = Number(item.quantity) || 0;
      map.set(productId, (map.get(productId) || 0) + quantity);
      return map;
    }, new Map());

    const productIds = Array.from(quantityByProduct.keys());
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(
      products.map((product) => [String(product._id), product])
    );

    let totalAmount = 0;
    const orderItems = [];
    const stockUpdates = [];

    for (const item of items) {
      const productId = String(item.product);
      const product = productMap.get(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`,
        });
      }

      const totalQuantity = quantityByProduct.get(productId) || 0;
      if (product.stock < totalQuantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`,
        });
      }

      totalAmount += product.price * (Number(item.quantity) || 0);

      if (
        !stockUpdates.some(
          (update) => String(update.updateOne.filter._id) === productId
        )
      ) {
        stockUpdates.push({
          updateOne: {
            filter: { _id: productId, stock: { $gte: totalQuantity } },
            update: { $inc: { stock: -totalQuantity } },
          },
        });
      }

      orderItems.push({
        product: item.product,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        size: item.size || '',
        color: item.color || '',
      });
    }

    // Atomic bulk stock update
    if (stockUpdates.length > 0) {
      const bulkResult = await Product.bulkWrite(stockUpdates, { ordered: true });
      if (bulkResult.modifiedCount !== stockUpdates.length) {
        return res.status(400).json({
          success: false,
          message: 'Failed to update product stock. Please retry.',
        });
      }
    }

    const orderNumber = generateOrderNumber();
    const paymentReceipt = req.file ? `/uploads/${req.file.filename}` : undefined;

    const order = await Order.create({
      orderNumber,
      user: req.user?._id || null,
      items: orderItems,
      totalAmount,
      shippingAddress,
      billingAddress,
      paymentMethod,
      paymentNumber,
      paymentReceipt,
      notes,
      ...(coupon ? { coupon } : {}),
    });

    // Clear cart if user is authenticated
    if (req.user?._id) {
      await Cart.findOneAndDelete({ user: req.user._id });
    }

    // Return successful response immediately
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order,
    });

    // Asynchronously dispatch email notifications in background
    const customerEmail = req.user?.email || shippingAddress.email;

    console.log(`📧 Order #${order.orderNumber} placed. Sending emails to admin and customer...`);
    
    Promise.allSettled([
      sendOrderEmail(order),
      customerEmail
        ? sendOrderConfirmationEmail(
            customerEmail,
            order.orderNumber,
            order.items,
            totalAmount
          )
        : Promise.resolve(),
    ]).then((results) => {
      results.forEach((result, index) => {
        const emailType = index === 0 ? 'ADMIN' : 'CUSTOMER';
        if (result.status === 'fulfilled') {
          console.log(`✅ ${emailType} email dispatched successfully`);
        } else {
          console.error(`❌ ${emailType} email failed:`, result.reason?.message || result.reason);
        }
      });
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
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

    if (
      order.user?._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
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

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res
      .status(200)
      .json({ success: true, message: 'Order status updated', order });
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