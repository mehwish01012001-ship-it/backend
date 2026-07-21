const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', categoryController.getAllCategories);
router.get('/:season/subcategories', categoryController.getSubcategoriesBySeason);
router.get('/:id', categoryController.getCategoryById);

router.post('/', protect, authorize('admin'), upload.single('image'), categoryController.createCategory);
router.put('/:id', protect, authorize('admin'), upload.single('image'), categoryController.updateCategory);
router.delete('/:id', protect, authorize('admin'), categoryController.deleteCategory);

module.exports = router;
