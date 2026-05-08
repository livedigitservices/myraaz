const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name:    { type: String, required: true },
    rating:  { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Product name is required'],
      trim:     true,
    },
    description: {
      type:     String,
      required: [true, 'Product description is required'],
    },
    price: {
      type:     Number,
      required: [true, 'Product price is required'],
      min:      [0, 'Price cannot be negative'],
    },
    category: {
      type:     String,
      required: [true, 'Category is required'],
      enum:     ['hair-oil', 'shampoo', 'conditioner', 'hair-mask', 'serum'],
    },
    brand: {
      type:     String,
      required: [true, 'Brand is required'],
      trim:     true,
    },

    /* ── Multiple images (max 4) ── */
    images: {
      type:     [String],
      required: true,
      validate: {
        validator: arr => arr.length >= 1 && arr.length <= 4,
        message:   'Product must have 1 to 4 images',
      },
    },

    /* Keep image as alias for first image (backward compat) */
    image: {
      type: String,
    },

    stock: {
      type:    Number,
      default: 0,
      min:     [0, 'Stock cannot be negative'],
    },
    rating:     { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    reviews:    [reviewSchema],
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/* Auto-set image to first of images array */
productSchema.pre('save', function (next) {
  if (this.images?.length > 0) {
    this.image = this.images[0];
  }
});

productSchema.index({ name: 'text', description: 'text', brand: 'text' });

module.exports = mongoose.model('Product', productSchema);