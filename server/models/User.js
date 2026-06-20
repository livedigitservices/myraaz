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
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
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

    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    cart:     [cartItemSchema],

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

    returnCount:    { type: Number,  default: 0 },
    flaggedCount:   { type: Number,  default: 0 },
    isFraudSuspect: { type: Boolean, default: false },

    // ── Password-reset OTP ──
    resetOtpHash:     { type: String,  select: false },
    resetOtpExpiry:   { type: Number,  select: false },
    resetOtpAttempts: { type: Number,  default: 0, select: false },
    resetOtpVerified: { type: Boolean, default: false, select: false },

    // ── Phone login OTP (persisted in DB — survives serverless cold starts) ──
    phoneOtp:        { type: String,  select: false },
    phoneOtpExpiry:  { type: Number,  select: false },
    phoneOtpAttempts:{ type: Number,  default: 0, select: false },
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
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);