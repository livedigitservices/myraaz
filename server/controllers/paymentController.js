const Razorpay = require('razorpay');
const Stripe   = require('stripe');
const crypto   = require('crypto');
const Order    = require('../models/Order');
const { debitWallet } = require('../services/walletService');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

/* ── Razorpay create order ── */
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR' } = req.body;

    if (!amount || amount <= 0)
      return res.status(400).json({ message: 'Invalid amount' });

    const options = {
      amount:   Math.round(amount * 100),
      currency,
      receipt:  `receipt_${Date.now()}`,
      notes:    { userId: req.user._id.toString() },
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      keyId:    process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Razorpay create error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ── Razorpay verify ── */
const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    /* Verify signature */
    const body     = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature)
      return res.status(400).json({ message: 'Invalid payment signature' });

    /* Update order */
    const order = await Order.findById(orderId);
    if (!order)
      return res.status(404).json({ message: 'Order not found' });

    order.isPaid  = true;
    order.paidAt  = Date.now();
    order.status  = 'processing';
    order.paymentResult = {
      id:     razorpay_payment_id,
      status: 'paid',
      email:  req.user?.email,
    };
    await order.save();

    res.json({ message: 'Payment verified', order });
  } catch (err) {
    console.error('Razorpay verify error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ── Stripe create intent ── */
const createStripeIntent = async (req, res) => {
  try {
    const { amount, orderId } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount:   Math.round(amount * 100),
      currency: 'inr',
      metadata: { orderId, userId: req.user._id.toString() },
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe intent error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ── Stripe verify ── */
const verifyStripePayment = async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded')
      return res.status(400).json({ message: 'Payment not completed' });

    const order = await Order.findById(orderId);
    if (!order)
      return res.status(404).json({ message: 'Order not found' });

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
    console.error('Stripe verify error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ── Wallet payment ── */
const payWithWallet = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order)
      return res.status(404).json({ message: 'Order not found' });

    if (order.isPaid)
      return res.status(400).json({ message: 'Order already paid' });

    await debitWallet(
      req.user._id,
      order.totalPrice,
      `Payment for order #${order._id.toString().slice(-8).toUpperCase()}`,
      order._id,
    );

    order.isPaid        = true;
    order.paidAt        = Date.now();
    order.status        = 'processing';
    order.paymentMethod = 'Wallet';
    order.paymentResult = {
      id:     `wallet_${Date.now()}`,
      status: 'paid',
      email:  req.user?.email,
    };
    await order.save();

    res.json({ message: 'Payment successful', order });
  } catch (err) {
    console.error('Wallet pay error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ── Razorpay webhook ── */
const razorpayWebhook = async (req, res) => {
  try {
    const secret    = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (secret) {
      const expected = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (expected !== signature) {
        return res.status(400).json({ message: 'Invalid webhook signature' });
      }
    }

    const { event, payload } = req.body;
    console.log('Razorpay webhook event:', event);

    if (event === 'payment.captured') {
      const paymentId = payload?.payment?.entity?.id;
      const notes     = payload?.payment?.entity?.notes;
      if (notes?.orderId) {
        const order = await Order.findById(notes.orderId);
        if (order && !order.isPaid) {
          order.isPaid        = true;
          order.paidAt        = Date.now();
          order.status        = 'processing';
          order.paymentResult = { id: paymentId, status: 'paid' };
          await order.save();
        }
      }
    }

    res.json({ received: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createStripeIntent,
  verifyStripePayment,
  payWithWallet,
  razorpayWebhook,
};