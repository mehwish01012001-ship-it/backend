const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getCustomers, getCustomerById } = require('../controllers/users/customerController');

router.get('/', protect, authorize('admin'), getCustomers);
router.get('/:id', protect, authorize('admin'), getCustomerById);

module.exports = router;
