




const mongoose = require("mongoose");

const heroSliderSlideSchema = new mongoose.Schema(
  {
    tag: {
      type: String,
      trim: true,
      default: "",
    },

    title: {
      type: String,
      trim: true,
      default: "",
    },

    highlight: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    buttonText: {
      type: String,
      trim: true,
      default: "Explore Collection",
    },

    category: {
      type: String,
      trim: true,
      default: "Luxury Collection",
    },

    image: {
      type: String,
      trim: true,
      default: "",
    },

    mediaType: {
      type: String,
      enum: ["image", "video"],
      default: "image",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    order: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true, // Automatically creates createdAt & updatedAt
    versionKey: false,
  }
);

module.exports = mongoose.model(
  "HeroSliderSlide",
  heroSliderSlideSchema
);