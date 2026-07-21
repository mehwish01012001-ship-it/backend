const HeroSliderSlide = require('../models/HeroSliderSlide');
const { uploadImage, deleteImage } = require('../services/uploadService');

exports.getActiveSlides = async (req, res) => {
  try {
    const slides = await HeroSliderSlide.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
    res.status(200).json({ success: true, slides });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllSlides = async (req, res) => {
  try {
    const slides = await HeroSliderSlide.find().sort({ order: 1, createdAt: 1 });
    res.status(200).json({ success: true, slides });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createSlide = async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    let imageUrl = '';

    console.log('📝 Hero slide form data received:', {
      body: req.body,
      file: req.file ? { filename: req.file.filename, path: req.file.path } : null,
      isActive: req.body.isActive,
      isActiveType: typeof req.body.isActive,
    });

    if (req.file) {
      imageUrl = await uploadImage(req.file.path, 'heroslider', baseUrl);
    }

    const mediaType = req.file && req.file.mimetype && req.file.mimetype.startsWith('video/') ? 'video' : 'image';

    const slide = await HeroSliderSlide.create({
      tag: req.body.tag || '',
      title: req.body.title || '',
      highlight: req.body.highlight || '',
      description: req.body.description || '',
   
      image: imageUrl,
      mediaType,
      isActive: req.body.isActive === 'true' || req.body.isActive === true,
      order: req.body.order ? Number(req.body.order) : 0,
    });

    res.status(201).json({ success: true, message: 'Hero slide created', slide });
  } catch (error) {
    console.error('❌ Hero slider create error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    res.status(500).json({ success: false, message: error.message || 'Failed to create hero slide' });
  }
};

exports.updateSlide = async (req, res) => {
  try {
    const slide = await HeroSliderSlide.findById(req.params.id);
    if (!slide) {
      return res.status(404).json({ success: false, message: 'Slide not found' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    if (req.body.tag !== undefined) slide.tag = req.body.tag;
    if (req.body.title !== undefined) slide.title = req.body.title;
    if (req.body.highlight !== undefined) slide.highlight = req.body.highlight;
    if (req.body.description !== undefined) slide.description = req.body.description;
    if (req.body.buttonText !== undefined) slide.buttonText = req.body.buttonText;
    if (req.body.category !== undefined) slide.category = req.body.category;
    if (req.body.isActive !== undefined) slide.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    if (req.body.order !== undefined) slide.order = Number(req.body.order);

    if (req.file) {
      if (slide.image) {
        await deleteImage(slide.image);
      }
      slide.image = await uploadImage(req.file.path, 'heroslider', baseUrl);
      slide.mediaType = req.file.mimetype && req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    }

    await slide.save();
    res.status(200).json({ success: true, message: 'Hero slide updated', slide });
  } catch (error) {
    console.error('❌ Hero slider update error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    res.status(500).json({ success: false, message: error.message || 'Failed to update hero slide' });
  }
};

exports.deleteSlide = async (req, res) => {
  try {
    const slide = await HeroSliderSlide.findByIdAndDelete(req.params.id);
    if (!slide) {
      return res.status(404).json({ success: false, message: 'Slide not found' });
    }

    if (slide.image) {
      await deleteImage(slide.image);
    }

    res.status(200).json({ success: true, message: 'Hero slide deleted' });
  } catch (error) {
    console.error('Hero slider delete error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete hero slide' });
  }
};
