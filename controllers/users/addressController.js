const User = require('../../models/User');
const mongoose = require('mongoose');

exports.addAddress = async (req, res) => {
  try {
    const address = {
      _id: new mongoose.Types.ObjectId(),
      ...req.body,
    };
    const user = await User.findByIdAndUpdate(req.user._id, { $push: { addresses: address }, updatedAt: Date.now() }, { new: true });
    res.status(201).json({ success: true, message: 'Address added', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const updateData = { ...req.body, updatedAt: Date.now() };
    const user = await User.findOneAndUpdate(
      { _id: req.user._id, 'addresses._id': addressId },
      { $set: { 'addresses.$': updateData } },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    res.status(200).json({ success: true, message: 'Address updated', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findByIdAndUpdate(req.user._id, { $pull: { addresses: { _id: addressId } }, updatedAt: Date.now() }, { new: true });
    res.status(200).json({ success: true, message: 'Address deleted', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
