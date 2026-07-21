const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const compareController = require('../controllers/compareController');

router.get('/', protect, compareController.getCompareItems);
router.post('/add', protect, compareController.addToCompare);
router.delete('/:productId', protect, compareController.removeFromCompare);

module.exports = router;
