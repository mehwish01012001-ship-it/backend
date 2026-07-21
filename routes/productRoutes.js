const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const handleValidationErrors = require('../middleware/validation');
const { createProductValidator } = require('../validators/productValidator');

router.get('/featured', productController.getFeaturedProducts);
router.get('/new-arrivals', productController.getNewArrivals);
router.get('/', productController.getAllProducts);
router.get('/slug/:slug', productController.getProductBySlug);
router.get('/:id', productController.getProductById);

router.post('/', protect, authorize('admin'), upload.array('images', 10), createProductValidator, handleValidationErrors, productController.createProduct);
router.put('/:id', protect, authorize('admin'), upload.array('images', 10), productController.updateProduct);
router.delete('/:id', protect, authorize('admin'), productController.deleteProduct);

module.exports = router;
