const User = require('../../models/User');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, avatar } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { firstName, lastName, phone, avatar, updatedAt: Date.now() }, { new: true, runValidators: true }).select('-password');
    res.status(200).json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
