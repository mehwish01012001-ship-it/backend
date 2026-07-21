const express = require('express');
const router = express.Router();
const heroSliderController = require('../controllers/heroSliderController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/public', heroSliderController.getActiveSlides);
router.get('/', protect, authorize('admin'), heroSliderController.getAllSlides);
router.post('/', protect, authorize('admin'), upload.single('image'), heroSliderController.createSlide);
router.put('/:id', protect, authorize('admin'), upload.single('image'), heroSliderController.updateSlide);
router.delete('/:id', protect, authorize('admin'), heroSliderController.deleteSlide);

module.exports = router;
