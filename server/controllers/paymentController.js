/**
 * paymentController.js
 *
 * Razorpay (cards / UPI / netbanking) + webhook backup.
 *
 * Removed:
 *  - walletPay  → wallet is handled atomically inside orderController.placeOrder
 *  - createUpiQr, getQrPaymentStatus, verifyQrPayment → QR feature removed
 *  - qr_code.credited webhook handler → no longer needed
 */

const Razorpay = require('razorpay');
const crypto   = require('crypto');
const Order    = require('../models/Order');

/* ── Razorpay client ── */
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ── Mark order paid (idempotent) ── */
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

/* ── Verify Razorpay HMAC signature ── */
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
   Does NOT touch your DB. Frontend calls this before opening the modal.
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
   Called after Razorpay confirms payment in the modal handler().
   Frontend creates DB order first, then calls this to mark it paid.

   Body: razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId
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
   GET /api/payment/razorpay/order-status/:razorpayOrderId
   Real-time poll for a Razorpay order's payment status.
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
        method:    captured.method,
        amount:    captured.amount / 100,
      });
    }

    const failed = (payments.items || []).find(p => p.status === 'failed');
    if (failed) return res.json({ status: 'failed', paymentId: failed.id });

    res.json({ status: 'pending' });
  } catch (err) {
    console.error('[Razorpay] order-status error:', err.message);
    res.status(500).json({ message: 'Failed to fetch payment status.' });
  }
};

/* ─────────────────────────────────────────────────────────
   POST /api/payment/webhook/razorpay
   Backup: marks order paid if client-side verify never reached server
   (e.g. user closed tab after paying).
   Raw body required — configured in server.js BEFORE express.json().
───────────────────────────────────────────────────────── */
const razorpayWebhook = async (req, res) => {
  try {
    const secret    = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    const rawBody   = req.body;

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

    /* payment.captured — mark order paid */
    if (event === 'payment.captured') {
      const paymentEntity = payload?.payload?.payment?.entity || {};
      const paymentId     = paymentEntity.id;
      const notes         = paymentEntity.notes || {};
      const email         = paymentEntity.email || '';

      if (notes.orderId) {
        const order = await Order.findById(notes.orderId);
        if (order) {
          await markOrderPaid(order, paymentId, email);
          console.log(`[Razorpay webhook] Order ${notes.orderId} marked paid`);
        }
      }
    }

    /* payment.failed — log for debugging */
    if (event === 'payment.failed') {
      const paymentEntity = payload?.payload?.payment?.entity || {};
      console.warn('[Razorpay webhook] Payment failed:', {
        id:          paymentEntity.id,
        orderId:     paymentEntity.notes?.orderId,
        errorCode:   paymentEntity.error_code,
        errorReason: paymentEntity.error_reason,
      });
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
  getRazorpayOrderStatus,
  razorpayWebhook,
};