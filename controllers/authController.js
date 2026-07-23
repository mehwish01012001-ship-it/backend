const crypto = require('crypto');
const User = require('../models/User');
const { uploadSingleImage, deleteImage } = require('../services/cloudinaryService');
const { generateToken } = require('../utils/helpers');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    user = await User.create({
      firstName,
      lastName,
      email,
      password,
    });

    const token = generateToken(user._id);
    await sendWelcomeEmail(email, firstName);

    const fullUser = await User.findById(user._id).select('-password');

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: fullUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    user.lastLogin = new Date();
    await user.save();

    const fullUser = await User.findById(user._id).select('-password');

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: fullUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, address } = req.body;

    const updateData = { updatedAt: Date.now() };

    if (typeof firstName === 'string' && firstName.trim()) {
      updateData.firstName = firstName.trim();
    }

    if (typeof lastName === 'string' && lastName.trim()) {
      updateData.lastName = lastName.trim();
    }

    if (typeof phone === 'string') {
      updateData.phone = phone.trim() || null;
    }

    if (typeof address === 'string') {
      updateData.address = address.trim() || null;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Avatar image is required' });
    }

    try {
      const uploadResult = await uploadSingleImage(req.file.buffer, 'users');
      
      // Get the user to delete old avatar if it exists
      const user = await User.findById(req.user._id);
      if (user && user.avatarPublicId) {
        try {
          await deleteImage(user.avatarPublicId);
        } catch (deleteError) {
          console.warn('⚠️ Failed to delete old avatar:', deleteError.message);
        }
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { 
          avatar: uploadResult.url, 
          avatarPublicId: uploadResult.publicId,
          updatedAt: Date.now() 
        },
        { new: true, runValidators: true }
      ).select('-password');

      res.status(200).json({ success: true, message: 'Avatar updated successfully', user: updatedUser });
    } catch (uploadError) {
      console.error('❌ Failed to upload avatar:', uploadError.message);
      return res.status(400).json({ 
        success: false, 
        message: `Failed to upload avatar: ${uploadError.message}` 
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with that email' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendPasswordResetEmail(email, resetLink);

    res.status(200).json({ success: true, message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const { fullName, phone, addressLine1, addressLine2, city, state, zipCode, country, isDefault } = req.body;

    const address = {
      _id: new (require('mongoose')).Types.ObjectId(),
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      zipCode,
      country,
      isDefault,
    };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { addresses: address }, updatedAt: Date.now() },
      { new: true }
    );

    res.status(201).json({ success: true, message: 'Address added successfully', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { fullName, phone, addressLine1, addressLine2, city, state, zipCode, country, isDefault } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          'addresses.$[elem]': {
            fullName,
            phone,
            addressLine1,
            addressLine2,
            city,
            state,
            zipCode,
            country,
            isDefault,
          },
        },
        updatedAt: Date.now(),
      },
      {
        arrayFilters: [{ 'elem._id': addressId }],
        new: true,
      }
    );

    res.status(200).json({ success: true, message: 'Address updated successfully', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { addresses: { _id: addressId } }, updatedAt: Date.now() },
      { new: true }
    );

    res.status(200).json({ success: true, message: 'Address deleted successfully', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
