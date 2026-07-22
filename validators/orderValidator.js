const { body } = require('express-validator');

exports.createOrderValidator = [
  body('items').custom((value) => {
    if (!value) return false;
    try {
      const items = typeof value === 'string' ? JSON.parse(value) : value;
      return (
        Array.isArray(items) &&
        items.length > 0 &&
        items.every(
          (item) =>
            item &&
            (typeof item.product === 'string' || typeof item.product === 'number') &&
            Number(item.quantity) > 0
        )
      );
    } catch {
      return false;
    }
  }).withMessage('At least one valid product is required'),
  body('paymentMethod')
    .isIn([
      'bank_account',
      'jazzcash',
      'easypaisa',
      'other_bank',
      'stripe',
      'paypal',
      'bank_transfer',
      'cash_on_delivery',
    ])
    .withMessage('Invalid payment method'),
  body('shippingAddress')
    .custom((value) => {
      if (!value) return false;
      try {
        const address = typeof value === 'string' ? JSON.parse(value) : value;
        return (
          address &&
          (address.fullName || (address.firstName && address.lastName)) &&
          address.addressLine1 &&
          address.city &&
          address.country &&
          address.phone
        );
      } catch {
        return false;
      }
    })
    .withMessage('Shipping address is required and must include fullName, addressLine1, city, country, and phone'),
];

exports.updateOrderStatusValidator = [
  body('orderStatus').optional().isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid order status'),
  body('paymentStatus').optional().isIn(['pending', 'paid', 'failed', 'refunded']).withMessage('Invalid payment status'),
  body().custom((value) => {
    if (!value.orderStatus && !value.paymentStatus) {
      throw new Error('At least one status field is required');
    }
    return true;
  }),
];
