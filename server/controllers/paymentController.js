/**
 * paymentController.js
 *
 * Handles Razorpay, Stripe, and Wallet gateway flows.
 *
 * Critical design rule enforced here:
 *   - Razorpay / Stripe: the DB order is created by the CLIENT only after the
 *     gateway confirms payment. This controller only verifies the signature and
 *     marks an existing order as paid. It never creates orders.
 *   - Wallet: atomically deducts balance and marks the order paid in a single
 *     DB transaction so partial failures are impossible.
 */

const Razorpay = require('razorpay');
const Stripe   = require('stripe');
const crypto   = require('crypto');
const mongoose = require('mongoose');
const Order    = require('../models/Order');
const User     = require('../models/User');

/* ── Gateway clients ── */
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */

/**
 * Mark an order as paid. Shared by Razorpay verify, Stripe verify, and webhook.
 * Idempotent — safe to call multiple times.
 */
const markOrderPaid = async (order, paymentId, email = '') => {
  if (order.isPaid) return order; // already paid, skip

  order.isPaid  = true;
  order.paidAt  = new Date();
  order.status  = 'processing';
  order.paymentResult = {
    id:            paymentId,
    status:        'paid',
    update_time:   new Date().toISOString(),
    email_address: email,
  };

  return order.save();
};

/* ─────────────────────────────────────────────────────────
   POST /api/payment/razorpay/create-order
   Creates a Razorpay-side payment session only.
   Does NOT touch your DB. The frontend calls this before
   opening the Razorpay modal.
───────────────────────────────────────────────────────── */
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR' } = req.body;

    if (!amount || Number(amount) <= 0)
      return res.status(400).json({ message: 'Invalid amount' });

    const order = await razorpay.orders.create({
      amount:   Math.round(Number(amount) * 100), // convert to paise
      currency,
      receipt:  `rcpt_${Date.now()}`,
      notes:    { userId: req.user._id.toString() },
    });

    res.json({
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      keyId:    process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('[Razorpay] create-order error:', err.message);
    res.status(500).json({ message: 'Failed to create payment session. Try again.' });
  }
};

/* ─────────────────────────────────────────────────────────
   POST /api/payment/razorpay/verify
   Called by the frontend AFTER:
     1. Razorpay confirms payment in the modal handler
     2. Frontend creates the DB order
     3. Frontend sends both the Razorpay response + orderId here
   This verifies the HMAC signature and marks the order paid.
───────────────────────────────────────────────────────── */
const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId)
      return res.status(400).json({ message: 'Missing required payment fields' });

    /* Verify HMAC signature */
    const body     = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature)
      return res.status(400).json({ message: 'Invalid payment signature. Contact support.' });

    const order = await Order.findById(orderId);
    if (!order)
      return res.status(404).json({ message: 'Order not found' });

    /* Ensure the order belongs to the requesting user */
    if (order.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Unauthorized' });

    const updated = await markOrderPaid(order, razorpay_payment_id, req.user.email);
    res.json({ message: 'Payment verified', order: updated });
  } catch (err) {
    console.error('[Razorpay] verify error:', err.message);
    res.status(500).json({ message: 'Payment verification failed. Contact support.' });
  }
};

/* ─────────────────────────────────────────────────────────
   POST /api/payment/stripe/create-intent
───────────────────────────────────────────────────────── */
const createStripeIntent = async (req, res) => {
  try {
    const { amount, orderId } = req.body;

    if (!amount || Number(amount) <= 0)
      return res.status(400).json({ message: 'Invalid amount' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount:   Math.round(Number(amount) * 100),
      currency: 'inr',
      metadata: { orderId: orderId || '', userId: req.user._id.toString() },
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('[Stripe] create-intent error:', err.message);
    res.status(500).json({ message: 'Failed to create payment intent. Try again.' });
  }
};

/* ─────────────────────────────────────────────────────────
   POST /api/payment/stripe/verify
───────────────────────────────────────────────────────── */
const verifyStripePayment = async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    if (!paymentIntentId || !orderId)
      return res.status(400).json({ message: 'Missing paymentIntentId or orderId' });

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded')
      return res.status(400).json({ message: 'Payment not completed' });

    const order = await Order.findById(orderId);
    if (!order)
      return res.status(404).json({ message: 'Order not found' });

    if (order.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Unauthorized' });

    const updated = await markOrderPaid(order, paymentIntentId, req.user.email);
    res.json({ message: 'Payment verified', order: updated });
  } catch (err) {
    console.error('[Stripe] verify error:', err.message);
    res.status(500).json({ message: 'Payment verification failed. Contact support.' });
  }
};

/* ─────────────────────────────────────────────────────────
   POST /api/payment/wallet
   Atomically deducts wallet balance and marks order paid.
   Uses a MongoDB session + transaction to prevent double-spend.
───────────────────────────────────────────────────────── */
const walletPay = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.body;
    if (!orderId)
      return res.status(400).json({ message: 'orderId is required' });

    const [order, user] = await Promise.all([
      Order.findById(orderId).session(session),
      User.findById(req.user._id).session(session),
    ]);

    if (!order)
      return res.status(404).json({ message: 'Order not found' });

    if (order.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Unauthorized' });

    if (order.isPaid) {
      await session.abortTransaction();
      session.endSession();
      return res.json({ message: 'Already paid', order });
    }

    const balance     = user.walletBalance || 0;
    const orderAmount = order.totalPrice;

    if (balance < orderAmount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: `Insufficient wallet balance. Available: ₹${balance.toLocaleString('en-IN')}`,
      });
    }

    /* Deduct balance */
    user.walletBalance = parseFloat((balance - orderAmount).toFixed(2));
    await user.save({ session });

    /* Mark paid */
    order.isPaid  = true;
    order.paidAt  = new Date();
    order.status  = 'processing';
    order.paymentResult = {
      id:           `wallet_${Date.now()}`,
      status:       'paid',
      update_time:  new Date().toISOString(),
      email_address: user.email,
    };
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ message: 'Wallet payment successful', order });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('[Wallet] pay error:', err.message);
    res.status(500).json({ message: 'Wallet payment failed. Your balance was not deducted.' });
  }
};

/* ─────────────────────────────────────────────────────────
   POST /api/payment/webhook/razorpay
   Backup: marks order paid if the client-side verify call
   never reached the server (e.g. user closed tab after paying).
   Raw body required — configure in server.js before express.json().
───────────────────────────────────────────────────────── */
const razorpayWebhook = async (req, res) => {
  try {
    const secret    = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    const rawBody   = req.body; // raw Buffer from express.raw()

    /* Verify webhook signature if secret is configured */
    if (secret && signature) {
      const expected = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      if (expected !== signature)
        return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const payload = JSON.parse(rawBody.toString());
    const { event } = payload;
    console.log('[Razorpay webhook] event:', event);

    if (event === 'payment.captured') {
      const paymentId = payload?.payload?.payment?.entity?.id;
      const notes     = payload?.payload?.payment?.entity?.notes || {};

      /* notes.orderId is set if the frontend verify already ran — check anyway */
      if (notes.orderId) {
        const order = await Order.findById(notes.orderId);
        if (order) await markOrderPaid(order, paymentId);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[Razorpay webhook] error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createStripeIntent,
  verifyStripePayment,
  walletPay,
  razorpayWebhook,
};