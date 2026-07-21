const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { protect, authorize } = require('../middleware/auth');

router.post('/validate', couponController.validateCoupon);

router.get('/', protect, authorize('admin'), couponController.getAllCoupons);
router.post('/', protect, authorize('admin'), couponController.createCoupon);
router.delete('/:id', protect, authorize('admin'), couponController.deleteCoupon);

module.exports = router;
