const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  submitContactMessage,
  getContactMessages,
  updateContactMessageStatus,
} = require('../controllers/contactController');

router.post('/', submitContactMessage);
router.get('/', protect, authorize('admin'), getContactMessages);
router.put('/:id/status', protect, authorize('admin'), updateContactMessageStatus);

module.exports = router;
