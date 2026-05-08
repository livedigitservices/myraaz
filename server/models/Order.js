const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:     { type: String,  required: true },
  image:    { type: String,  required: true },
  price:    { type: Number,  required: true },
  quantity: { type: Number,  required: true, min: 1 },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    orderItems: {
      type:     [orderItemSchema],
      required: true,
      validate: {
        validator: items => items.length > 0,
        message:   'Order must have at least one item',
      },
    },

    shippingAddress: {
      fullName: { type: String, required: true }, 
      phone:    { type: String, required: true }, 
      address: { type: String, required: true },
      city:    { type: String, required: true },
      pincode: { type: String, required: true },
      state:   { type: String, required: true },
    },

    paymentMethod: {
      type:     String,
      required: true,
      enum:     ['Razorpay', 'COD', 'Stripe'],
      default:  'COD',
    },

    // Filled in after payment succeeds
    paymentResult: {
      id:       String,
      status:   String,
      email:    String,
    },

    isPaid:      { type: Boolean, default: false },
    paidAt:      { type: Date },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },

    status: {
      type:    String,
      enum:    ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },

    itemsPrice:    { type: Number, required: true },
    shippingPrice: { type: Number, required: true, default: 0 },
    totalPrice:    { type: Number, required: true },

    // Cancellation reason (optional)
    cancelReason: { type: String },
  },
  { timestamps: true }
);

// Auto-calculate rating after a review is added (used in productController)
// Virtual to get item count quickly
orderSchema.virtual('itemCount').get(function () {
  return this.orderItems.reduce((sum, item) => sum + item.quantity, 0);
});

module.exports = mongoose.model('Order', orderSchema);