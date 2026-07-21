const { body } = require('express-validator');

exports.registerValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

exports.loginValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.updateProfileValidator = [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('phone').optional({ nullable: true, checkFalsy: true }).trim().isMobilePhone().withMessage('Valid phone number is required'),
];

exports.addAddressValidator = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('phone').isMobilePhone().withMessage('Valid phone number is required'),
  body('addressLine1').trim().notEmpty().withMessage('Address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('zipCode').trim().notEmpty().withMessage('Zip code is required'),
  body('country').trim().notEmpty().withMessage('Country is required'),
];

exports.forgotPasswordValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
];

exports.resetPasswordValidator = [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];
