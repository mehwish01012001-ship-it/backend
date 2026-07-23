const HeroSliderSlide = require('../models/HeroSliderSlide');
const { uploadSingleImage, deleteImage } = require('../services/cloudinaryService');

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
    let imageUrl = '';
    let imagePublicId = '';

    console.log('📝 Hero slide form data received:', {
      body: req.body,
      file: req.file ? { originalname: req.file.originalname } : null,
      isActive: req.body.isActive,
    });

    if (req.file) {
      try {
        const uploadResult = await uploadSingleImage(req.file.buffer, 'hero-slider');
        imageUrl = uploadResult.url;
        imagePublicId = uploadResult.publicId;
      } catch (uploadError) {
        console.error('❌ Failed to upload hero slide image:', uploadError.message);
        return res.status(400).json({ 
          success: false, 
          message: `Failed to upload image: ${uploadError.message}` 
        });
      }
    }

    const mediaType = 'image';

    const slide = await HeroSliderSlide.create({
      tag: req.body.tag || '',
      title: req.body.title || '',
      highlight: req.body.highlight || '',
      description: req.body.description || '',
      image: imageUrl,
      imagePublicId,
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

    if (req.body.tag !== undefined) slide.tag = req.body.tag;
    if (req.body.title !== undefined) slide.title = req.body.title;
    if (req.body.highlight !== undefined) slide.highlight = req.body.highlight;
    if (req.body.description !== undefined) slide.description = req.body.description;
    if (req.body.buttonText !== undefined) slide.buttonText = req.body.buttonText;
    if (req.body.category !== undefined) slide.category = req.body.category;
    if (req.body.isActive !== undefined) slide.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    if (req.body.order !== undefined) slide.order = Number(req.body.order);

    // Handle image update
    if (req.file) {
      try {
        // Delete old image from Cloudinary if it exists
        if (slide.imagePublicId) {
          await deleteImage(slide.imagePublicId);
        }
        
        // Upload new image
        const uploadResult = await uploadSingleImage(req.file.buffer, 'hero-slider');
        slide.image = uploadResult.url;
        slide.imagePublicId = uploadResult.publicId;
        slide.mediaType = 'image';
      } catch (uploadError) {
        console.error('❌ Failed to upload hero slide image:', uploadError.message);
        return res.status(400).json({ 
          success: false, 
          message: `Failed to upload image: ${uploadError.message}` 
        });
      }
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

    // Delete image from Cloudinary if it exists
    if (slide.imagePublicId) {
      try {
        await deleteImage(slide.imagePublicId);
      } catch (error) {
        console.warn('⚠️ Failed to delete slide image from Cloudinary:', error.message);
      }
    }

    res.status(200).json({ success: true, message: 'Hero slide deleted' });
  } catch (error) {
    console.error('❌ Hero slider delete error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete hero slide' });
  }
};
