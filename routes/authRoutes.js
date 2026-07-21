const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const handleValidationErrors = require('../middleware/validation');
const { registerValidator, loginValidator, updateProfileValidator, addAddressValidator, forgotPasswordValidator, resetPasswordValidator } = require('../validators/authValidator');

router.post('/register', registerValidator, handleValidationErrors, authController.register);
router.post('/login', loginValidator, handleValidationErrors, authController.login);
router.post('/forgot-password', forgotPasswordValidator, handleValidationErrors, authController.forgotPassword);
router.post('/reset-password/:token', resetPasswordValidator, handleValidationErrors, authController.resetPassword);
router.get('/me', protect, authController.getProfile);
router.put('/update-profile', protect, updateProfileValidator, handleValidationErrors, authController.updateProfile);
router.put('/update-avatar', protect, upload.single('avatar'), authController.updateAvatar);
router.post('/add-address', protect, addAddressValidator, handleValidationErrors, authController.addAddress);
router.put('/update-address/:addressId', protect, authController.updateAddress);
router.delete('/delete-address/:addressId', protect, authController.deleteAddress);

module.exports = router;
