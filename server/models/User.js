const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const cartItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, default: 1, min: 1 },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
    },
    email: {
      type:     String,
      required: [true, 'Email is required'],
      unique:   true,
      lowercase: true,
      trim:     true,
      sparse:    true,
    },
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    isAdmin: {
      type:    Boolean,
      default: false,
    },

    // Wishlist — array of Product references
    wishlist: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
    ],

    // Cart — array of { product, quantity }
    cart: [cartItemSchema],

    // Shipping address saved for faster checkout
    defaultAddress: {
      address: String,
      city:    String,
      pincode: String,
      state:   String,
    },

    phone: {
      type: String,
      trim: true,
    },
    isPhoneUser: {
  type:    Boolean,
  default: false,
},
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt    = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);