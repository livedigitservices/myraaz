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

/**
 * Volume variant — each product can have multiple sizes (100ml, 200ml, 1L, etc.)
 * When variants exist, the top-level `price` acts as the base/default (smallest size).
 */
const variantSchema = new mongoose.Schema(
  {
    value:    { type: Number, required: true, min: 0 },          // e.g. 100, 200, 1
    unit:     { type: String, required: true, enum: ['ml', 'L'], default: 'ml' },
    label:    { type: String, default: '' },                     // e.g. "100ml", auto-filled if empty
    price:    { type: Number, required: true, min: 0 },
    stock:    { type: Number, required: true, min: 0, default: 0 },
    sku:      { type: String, default: '' },
  },
  { _id: false }
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
    images: {
      type:     [String],
      required: true,
      validate: {
        validator: arr => arr.length >= 1 && arr.length <= 4,
        message:   'Product must have 1 to 4 images',
      },
    },
    image:      { type: String },
    stock:      { type: Number, default: 0, min: [0, 'Stock cannot be negative'] },
    rating:     { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    reviews:    [reviewSchema],
    isFeatured: { type: Boolean, default: false },

    returnPolicy: {
      returnable:  { type: Boolean, default: true },
      returnDays:  { type: Number,  default: 7    },
      description: { type: String,  default: ''   },
    },

    /**
     * Volume variants — 100ml, 200ml, 1L etc.
     * If empty → single-size product (uses top-level price/stock).
     * Sorted ascending by ml equivalent before save.
     */
    variants: { type: [variantSchema], default: [] },

    /**
     * Same-product bulk pricing tiers.
     * Buy `quantity` or more of THIS product → get `price` per unit.
     */
    comboPrices: [
      {
        quantity: { type: Number, required: true, min: 2 },
        price:    { type: Number, required: true, min: 0 },
        label:    { type: String, default: ''            },
        _id:      false,
      },
    ],
  },
  { timestamps: true }
);

productSchema.pre('save', function () {
  if (this.images?.length > 0) this.image = this.images[0];

  // Auto-fill variant labels and sort by ml equivalent
  if (this.variants?.length) {
    this.variants = this.variants.map(v => ({
      ...v,
      label: v.label || `${v.value}${v.unit}`,
    }));
    this.variants.sort((a, b) => {
      const toMl = v => v.unit === 'L' ? v.value * 1000 : v.value;
      return toMl(a) - toMl(b);
    });
    // Sync top-level price/stock to smallest variant
    this.price = this.variants[0].price;
    this.stock = this.variants.reduce((s, v) => s + v.stock, 0);
  }

  if (this.comboPrices?.length > 1) {
    this.comboPrices.sort((a, b) => a.quantity - b.quantity);
  }
});

productSchema.index({ name: 'text', description: 'text', brand: 'text' });

module.exports = mongoose.model('Product', productSchema);