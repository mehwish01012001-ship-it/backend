const { body } = require('express-validator');

exports.createProductValidator = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').trim().notEmpty().withMessage('Product description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('stock').isInt({ min: 0 }).withMessage('Valid stock quantity is required'),
  body('subcategory').optional().trim(),
];

exports.updateProductValidator = [
  body('name').optional().trim().notEmpty(),
  body('price').optional().isFloat({ min: 0 }),
  body('stock').optional().isInt({ min: 0 }),
  body('subcategory').optional().trim(),
];
