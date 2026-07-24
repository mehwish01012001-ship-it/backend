const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getCustomers, getCustomerById, deleteCustomer } = require('../controllers/users/customerController');

router.get('/', protect, authorize('admin'), getCustomers);
router.get('/:id', protect, authorize('admin'), getCustomerById);
router.delete('/:id', protect, authorize('admin'), deleteCustomer);

module.exports = router;
