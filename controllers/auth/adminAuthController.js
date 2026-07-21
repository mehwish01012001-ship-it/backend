const User = require('../../models/User');
const { generateToken } = require('../../utils/helpers');

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, role: 'admin' }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    const token = generateToken(user._id);
    res.status(200).json({
      success: true,
      message: 'Admin logged in successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
