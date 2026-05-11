const Razorpay = require('razorpay');
const Stripe   = require('stripe');
const crypto   = require('crypto');
const Order    = require('../models/Order');

/* ── Razorpay instance ── */
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ── Stripe instance ── */
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

/* ════════════════════════════
   RAZORPAY
════════════════════════════ */

// POST /api/payment/razorpay/create-order
const createRazorpayOrder = async (req, res) => {
  try {
    console.log('Razorpay create order request:', req.body);
    console.log('Razorpay Key ID:', process.env.RAZORPAY_KEY_ID);

    const { amount } = req.body;

    if (!amount || amount <= 0)
      return res.status(400).json({ message: 'Invalid amount' });

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET)
      return res.status(500).json({ message: 'Razorpay credentials not configured' });

    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount:   Math.round(amount * 100),
      currency: 'INR',
      receipt:  `receipt_${Date.now()}`,
    };

    console.log('Creating Razorpay order with options:', options);
    const order = await razorpay.orders.create(options);
    console.log('Razorpay order created:', order.id);

    res.json({
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      keyId:    process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Razorpay error:', err.message);
    res.status(500).json({ message: err.message });
  }
};


// POST /api/payment/razorpay/verify
const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId, // our DB order ID
    } = req.body;

    /* Verify signature */
    const body      = razorpay_order_id + '|' + razorpay_payment_id;
    const expected  = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    /* Mark order as paid */
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.isPaid  = true;
    order.paidAt  = Date.now();
    order.status  = 'processing';
    order.paymentResult = {
      id:     razorpay_payment_id,
      status: 'paid',
      email:  req.user?.email,
    };
    await order.save();

    res.json({ message: 'Payment verified successfully', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ════════════════════════════
   STRIPE
════════════════════════════ */

// POST /api/payment/stripe/create-intent
const createStripeIntent = async (req, res) => {
  try {
    const { amount, orderId } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount:   Math.round(amount * 100), // convert to paise/cents
      currency: 'inr',
      metadata: { orderId },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/payment/stripe/verify
const verifyStripePayment = async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    /* Mark order as paid */
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.isPaid  = true;
    order.paidAt  = Date.now();
    order.status  = 'processing';
    order.paymentResult = {
      id:     paymentIntentId,
      status: 'paid',
      email:  req.user?.email,
    };
    await order.save();

    res.json({ message: 'Payment verified', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createStripeIntent,
  verifyStripePayment,
};