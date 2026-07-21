const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');
const handleValidationErrors = require('../middleware/validation');
const { createOrderValidator, updateOrderStatusValidator } = require('../validators/orderValidator');

router.post('/', protect, upload.single('paymentReceipt'), createOrderValidator, handleValidationErrors, orderController.createOrder);
router.get('/my-orders', protect, orderController.getMyOrders);
router.get('/track/:orderNumber', orderController.trackOrder);
router.get('/:id', protect, orderController.getOrderById);

router.get('/', protect, authorize('admin'), orderController.getAllOrders);
router.put('/:id/status', protect, authorize('admin'), updateOrderStatusValidator, handleValidationErrors, orderController.updateOrderStatus);

module.exports = router;
