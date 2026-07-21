const User = require('../models/User');
const Product = require('../models/Product');

exports.getCompareItems = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('compare');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, compare: user.compare || [] });
  } catch (error) {
    console.error('Compare fetch failed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addToCompare = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const alreadyAdded = user.compare?.some(
      (item) => item.toString() === productId.toString()
    );

    if (!alreadyAdded) {
      user.compare = [...new Set([...(user.compare || []), productId])];
      await user.save();
    }

    await user.populate('compare');
    res.status(200).json({ success: true, compare: user.compare });
  } catch (error) {
    console.error('Compare add failed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeFromCompare = async (req, res) => {
  try {
    const productId = req.params.productId;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.compare = (user.compare || []).filter(
      (item) => item.toString() !== productId.toString()
    );
    await user.save();

    await user.populate('compare');
    res.status(200).json({ success: true, compare: user.compare });
  } catch (error) {
    console.error('Compare remove failed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
