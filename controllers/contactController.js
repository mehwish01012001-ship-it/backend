const ContactMessage = require('../models/ContactMessage');

exports.submitContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Please fill in all fields.' });
    }

    const contactMessage = await ContactMessage.create({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
    });

    res.status(201).json({
      success: true,
      message: 'Your message has been received successfully.',
      data: contactMessage,
    });
  } catch (error) {
    console.error('Contact submit error:', error);
    res.status(500).json({ success: false, message: 'Unable to send your message right now.' });
  }
};

exports.getContactMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error('Get contact messages error:', error);
    res.status(500).json({ success: false, message: 'Unable to load contact messages.' });
  }
};

exports.updateContactMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await ContactMessage.findByIdAndUpdate(
      id,
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    res.status(200).json({ success: true, message: 'Status updated.', data: updated });
  } catch (error) {
    console.error('Update contact message status error:', error);
    res.status(500).json({ success: false, message: 'Unable to update message status.' });
  }
};
