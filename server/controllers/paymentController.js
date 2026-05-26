/**
 * paymentController.js
 *
 * Handles Razorpay (UPI / QR / Cards) and Wallet gateway flows.
 *
 * Critical design rule enforced here:
 *   - Razorpay: the DB order is created by the CLIENT only after the
 *     gateway confirms payment. This controller only verifies the signature
 *     and marks an existing order as paid. It never creates orders.
 *   - Wallet: atomically deducts balance and marks the order paid in a
 *     single DB transaction so partial failures are impossible.
 *
 * Razorpay features supported:
 *   - Standard checkout (cards, netbanking, wallets)
 *   - UPI collect (user enters UPI ID)
 *   - UPI QR (dynamic QR code for scan-and-pay)
 *   - Real-time payment status polling
 *   - Webhook backup for missed client-side verifications
 */

const Razorpay = require('razorpay');
const crypto   = require('crypto');
const mongoose = require('mongoose');
const Order    = require('../models/Order');
const User     = require('../models/User');

/* ── Razorpay client ── */
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */

/**
 * Mark an order as paid.
 * Idempotent — safe to call multiple times (e.g. verify + webhook).
 */
const markOrderPaid = async (order, paymentId, email = '') => {
  if (order.isPaid) return order;

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

/**
 * Verify Razorpay HMAC signature.
 * Returns true if valid, false otherwise.
 */
const isValidRazorpaySignature = (razorpayOrderId, razorpayPaymentId, signature) => {
  const body     = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expected === signature;
};

/* ─────────────────────────────────────────────────────────
   POST /api/payment/razorpay/create-order
   Creates a Razorpay-side payment session only.
   Does NOT touch your DB.
   The frontend calls this before opening the Razorpay modal.

   Body:
     amount   – order total in INR (e.g. 499.00)
     currency – optional, defaults to INR
───────────────────────────────────────────────────────── */
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR' } = req.body;

    if (!amount || Number(amount) <= 0)
      return res.status(400).json({ message: 'Invalid amount' });

    const order = await razorpay.orders.create({
      amount:   Math.round(Number(amount) * 100), // paise
      currency,
      receipt:  `rcpt_${Date.now()}`,
      notes:    { userId: req.user._id.toString() },
    });

    res.json({
      orderId:  order.id,   // rzp_order_id — pass to Razorpay checkout
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
   POST /api/payment/razorpay/create-upi-qr
   Generates a dynamic UPI QR code for a one-time payment.
   The QR expires after `close_by` (default 15 min).

   Flow:
     1. Frontend calls this endpoint.
     2. Server returns a QR image URL + virtual payment address (VPA).
     3. Frontend polls GET /api/payment/razorpay/status/:razorpayOrderId
        every 5 s until payment is captured.
     4. On capture, frontend calls /razorpay/verify to mark DB order paid.

   Body:
     amount   – in INR
     orderId  – your DB order _id (stored in QR description for tracing)
───────────────────────────────────────────────────────── */
const createUpiQr = async (req, res) => {
  try {
    const { amount, orderId } = req.body;

    if (!amount || Number(amount) <= 0)
      return res.status(400).json({ message: 'Invalid amount' });

    if (!orderId)
      return res.status(400).json({ message: 'orderId is required' });

    const closeBy = Math.floor(Date.now() / 1000) + 15 * 60; // 15 min from now

    /* Razorpay QR Codes API */
    const qr = await razorpay.qrCode.create({
      type:         'upi_qr',
      name:         process.env.STORE_NAME || 'My Store',
      usage:        'single_use',        // one-time QR
      fixed_amount: true,
      payment_amount: Math.round(Number(amount) * 100), // paise
      description:  `Order ${orderId}`,
      close_by:     closeBy,
      notes: {
        orderId:  orderId,
        userId:   req.user._id.toString(),
      },
    });

    res.json({
      qrId:      qr.id,           // store this to close/poll the QR
      imageUrl:  qr.image_url,    // render this as <img> on frontend
      closeBy:   closeBy,
    });
  } catch (err) {
    console.error('[Razorpay] create-upi-qr error:', err.message);
    res.status(500).json({ message: 'Failed to create UPI QR. Try again.' });
  }
};

/* ─────────────────────────────────────────────────────────
   GET /api/payment/razorpay/qr-status/:qrId
   Polls the QR payment status. Frontend calls this every 5 s.
   Returns { status, paymentId } once payment is captured.
───────────────────────────────────────────────────────── */
const getQrPaymentStatus = async (req, res) => {
  try {
    const { qrId } = req.params;
    if (!qrId)
      return res.status(400).json({ message: 'qrId is required' });

    /* Fetch payments made against this QR */
    const payments = await razorpay.qrCode.fetchAllPayments(qrId, {});

    if (payments.count > 0) {
      const payment = payments.items[0]; // single_use QR → one payment
      return res.json({
        status:    payment.status, // 'captured' | 'failed'
        paymentId: payment.id,
        amount:    payment.amount / 100,
      });
    }

    res.json({ status: 'pending' });
  } catch (err) {
    console.error('[Razorpay] qr-status error:', err.message);
    res.status(500).json({ message: 'Failed to fetch QR status.' });
  }
};

/* ─────────────────────────────────────────────────────────
   GET /api/payment/razorpay/order-status/:razorpayOrderId
   Real-time poll for a Razorpay order's payment status.
   Useful after standard checkout (cards / netbanking / UPI collect).
   Frontend calls this to confirm before calling /verify.

   Returns the first captured payment against the order if found.
───────────────────────────────────────────────────────── */
const getRazorpayOrderStatus = async (req, res) => {
  try {
    const { razorpayOrderId } = req.params;
    if (!razorpayOrderId)
      return res.status(400).json({ message: 'razorpayOrderId is required' });

    const payments = await razorpay.orders.fetchPayments(razorpayOrderId);

    const captured = (payments.items || []).find(p => p.status === 'captured');
    if (captured) {
      return res.json({
        status:    'captured',
        paymentId: captured.id,
        method:    captured.method,  // 'upi' | 'card' | 'netbanking' etc.
        amount:    captured.amount / 100,
      });
    }

    const failed = (payments.items || []).find(p => p.status === 'failed');
    if (failed) {
      return res.json({ status: 'failed', paymentId: failed.id });
    }

    res.json({ status: 'pending' });
  } catch (err) {
    console.error('[Razorpay] order-status error:', err.message);
    res.status(500).json({ message: 'Failed to fetch payment status.' });
  }
};

/* ─────────────────────────────────────────────────────────
   POST /api/payment/razorpay/verify
   Called by the frontend AFTER:
     1. Razorpay confirms payment in the modal/QR handler
     2. Frontend creates (or already has) the DB order
     3. Frontend sends: razorpay_order_id, razorpay_payment_id,
        razorpay_signature, orderId (your DB order _id)

   Verifies the HMAC signature and marks the order paid.
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

    /* Verify HMAC */
    if (!isValidRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature))
      return res.status(400).json({ message: 'Invalid payment signature. Contact support.' });

    const order = await Order.findById(orderId);
    if (!order)
      return res.status(404).json({ message: 'Order not found' });

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
   POST /api/payment/razorpay/verify-qr
   Variant of /verify for QR-based payments.
   QR payments don't produce a razorpay_order_id + signature
   the same way checkout does, so we verify by fetching the
   payment directly from Razorpay and confirming its status.

   Body:
     razorpay_payment_id – from QR poll result
     orderId             – your DB order _id
───────────────────────────────────────────────────────── */
const verifyQrPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, orderId } = req.body;

    if (!razorpay_payment_id || !orderId)
      return res.status(400).json({ message: 'Missing razorpay_payment_id or orderId' });

    /* Fetch payment from Razorpay to confirm capture */
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.status !== 'captured')
      return res.status(400).json({ message: `Payment not captured. Status: ${payment.status}` });

    const order = await Order.findById(orderId);
    if (!order)
      return res.status(404).json({ message: 'Order not found' });

    if (order.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Unauthorized' });

    const updated = await markOrderPaid(order, razorpay_payment_id, req.user.email);
    res.json({ message: 'QR Payment verified', order: updated });
  } catch (err) {
    console.error('[Razorpay] verify-qr error:', err.message);
    res.status(500).json({ message: 'QR payment verification failed. Contact support.' });
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
      id:            `wallet_${Date.now()}`,
      status:        'paid',
      update_time:   new Date().toISOString(),
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
   Raw body required — configure in server.js BEFORE express.json().

   Handles:
     payment.captured – mark order paid
     payment.failed   – log for debugging / alerting
     qr_code.credited – mark order paid for QR payments
───────────────────────────────────────────────────────── */
const razorpayWebhook = async (req, res) => {
  try {
    const secret    = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    const rawBody   = req.body; // raw Buffer from express.raw()

    /* Always verify webhook signature in production */
    if (secret) {
      if (!signature)
        return res.status(400).json({ message: 'Missing webhook signature' });

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

    /* ── payment.captured ── */
    if (event === 'payment.captured') {
      const paymentEntity = payload?.payload?.payment?.entity || {};
      const paymentId     = paymentEntity.id;
      const notes         = paymentEntity.notes || {};
      const email         = paymentEntity.email || '';

      if (notes.orderId) {
        const order = await Order.findById(notes.orderId);
        if (order) {
          await markOrderPaid(order, paymentId, email);
          console.log(`[Razorpay webhook] Order ${notes.orderId} marked paid via payment.captured`);
        }
      }
    }

    /* ── qr_code.credited — fired when QR scan triggers a payment ── */
    if (event === 'qr_code.credited') {
      const qrEntity  = payload?.payload?.qr_code?.entity || {};
      const paymentId = qrEntity.payments?.items?.[0]?.id;
      const notes     = qrEntity.notes || {};

      if (notes.orderId && paymentId) {
        const order = await Order.findById(notes.orderId);
        if (order) {
          await markOrderPaid(order, paymentId);
          console.log(`[Razorpay webhook] Order ${notes.orderId} marked paid via qr_code.credited`);
        }
      }
    }

    /* ── payment.failed — log for alerting / retries ── */
    if (event === 'payment.failed') {
      const paymentEntity = payload?.payload?.payment?.entity || {};
      console.warn('[Razorpay webhook] Payment failed:', {
        id:          paymentEntity.id,
        orderId:     paymentEntity.notes?.orderId,
        errorCode:   paymentEntity.error_code,
        errorReason: paymentEntity.error_reason,
      });
      // Optionally: update order status to 'payment_failed', send user email, etc.
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[Razorpay webhook] error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  /* Razorpay – standard checkout (cards, netbanking, UPI collect) */
  createRazorpayOrder,
  verifyRazorpayPayment,
  getRazorpayOrderStatus,

  /* Razorpay – UPI QR */
  createUpiQr,
  getQrPaymentStatus,
  verifyQrPayment,

  /* Webhook backup */
  razorpayWebhook,

  /* Wallet */
  walletPay,
};