/**
 * paymentController.js
 *
 * Handles Razorpay and Stripe gateway flows only.
 * Wallet payment is handled inside orderController.placeOrder — not here.
 */

const Razorpay = require('razorpay');
const Stripe   = require('stripe');
const crypto   = require('crypto');
const Order    = require('../models/Order');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

/* ─────────────────────────────────────────
   POST /api/payment/razorpay/create-order
───────────────────────────────────────── */
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR' } = req.body;

    if (!amount || amount <= 0)
      return res.status(400).json({ message: 'Invalid amount' });

    const order = await razorpay.orders.create({
      amount:   Math.round(amount * 100), // paise
      currency,
      receipt:  `receipt_${Date.now()}`,
      notes:    { userId: req.user._id.toString() },
    });

    res.json({
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      keyId:    process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Razorpay create-order error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   POST /api/payment/razorpay/verify
───────────────────────────────────────── */
const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    // Verify HMAC signature
    const body     = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature)
      return res.status(400).json({ message: 'Invalid payment signature' });

    const order = await Order.findById(orderId);
    if (!order)      return res.status(404).json({ message: 'Order not found' });
    if (order.isPaid) return res.json({ message: 'Already paid', order }); // idempotent

    order.isPaid  = true;
    order.paidAt  = Date.now();
    order.status  = 'processing';
    order.paymentResult = {
      id:           razorpay_payment_id,
      status:       'paid',
      update_time:  new Date().toISOString(),
      email_address: req.user?.email || '',
    };
    await order.save();

    res.json({ message: 'Payment verified', order });
  } catch (err) {
    console.error('Razorpay verify error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   POST /api/payment/stripe/create-intent
───────────────────────────────────────── */
const createStripeIntent = async (req, res) => {
  try {
    const { amount, orderId } = req.body;

    if (!amount || amount <= 0)
      return res.status(400).json({ message: 'Invalid amount' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount:   Math.round(amount * 100), // paise / cents
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

/* ─────────────────────────────────────────
   POST /api/payment/stripe/verify
───────────────────────────────────────── */
const verifyStripePayment = async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded')
      return res.status(400).json({ message: 'Payment not completed' });

    const order = await Order.findById(orderId);
    if (!order)       return res.status(404).json({ message: 'Order not found' });
    if (order.isPaid) return res.json({ message: 'Already paid', order }); // idempotent

    order.isPaid  = true;
    order.paidAt  = Date.now();
    order.status  = 'processing';
    order.paymentResult = {
      id:           paymentIntentId,
      status:       'paid',
      update_time:  new Date().toISOString(),
      email_address: req.user?.email || '',
    };
    await order.save();

    res.json({ message: 'Payment verified', order });
  } catch (err) {
    console.error('Stripe verify error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   POST /api/payment/webhook/razorpay
   Raw body is required — handled in server.js
   before express.json()
───────────────────────────────────────── */
const razorpayWebhook = async (req, res) => {
  try {
    const secret    = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    const body      = req.body; // raw Buffer from express.raw()

    if (secret && signature) {
      const expected = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

      if (expected !== signature)
        return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const payload = JSON.parse(body.toString());
    const { event } = payload;
    console.log('Razorpay webhook event:', event);

    if (event === 'payment.captured') {
      const paymentId = payload?.payload?.payment?.entity?.id;
      const notes     = payload?.payload?.payment?.entity?.notes;

      if (notes?.orderId) {
        const order = await Order.findById(notes.orderId);
        if (order && !order.isPaid) {
          order.isPaid        = true;
          order.paidAt        = Date.now();
          order.status        = 'processing';
          order.paymentResult = {
            id:          paymentId,
            status:      'paid',
            update_time: new Date().toISOString(),
          };
          await order.save();
        }
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Razorpay webhook error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createStripeIntent,
  verifyStripePayment,
  razorpayWebhook,
};