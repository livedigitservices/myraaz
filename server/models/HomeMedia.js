const mongoose = require('mongoose');

/**
 * HomeMedia
 * Stores banner images and promo videos uploaded by admin
 * that appear on the homepage below the perks bar.
 */
const homeMediaSchema = new mongoose.Schema(
  {
    type: {
      type:     String,
      enum:     ['image', 'video'],
      required: true,
    },

    // Cloudinary secure URL
    url: {
      type:     String,
      required: true,
    },

    // Cloudinary public_id — needed for deletion
    publicId: {
      type:     String,
      required: true,
    },

    // Optional overlay text
    title:    { type: String, default: '' },
    subtitle: { type: String, default: '' },

    // Optional CTA button
    ctaText: { type: String, default: '' },
    ctaLink: { type: String, default: '/products' },

    // Display order — lower = shown first
    order: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HomeMedia', homeMediaSchema);