/**
 * paymentController.js
 *
 * Razorpay (cards / UPI / netbanking) + webhook backup.
 *
 * Flow note: the DB order is created by the client only AFTER Razorpay confirms
 * payment (Checkout.jsx handler -> POST /orders -> POST /payment/razorpay/verify).
 * verify stores razorpayOrderId on the order, so the webhook can find it later.
 */

const Razorpay = require('razorpay');
const crypto   = require('crypto');
const Order    = require('../models/Order');
const { verifyWebhookSignature, safeEqual } = require('../utils/razorpaySignature');

/* ── Razorpay client ── */
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* If a captured payment has no order after this long, stop asking Razorpay to retry */
const ORPHAN_AFTER_MS = 30 * 60 * 1000;

/* ── Mark order paid (idempotent) ── */
const markOrderPaid = async (order, paymentId, email = '', razorpayOrderId = '') => {
  if (razorpayOrderId && !order.razorpayOrderId) order.razorpayOrderId = razorpayOrderId;
  if (order.isPaid) return order.isModified() ? order.save() : order;

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

/* ── Verify Razorpay checkout HMAC signature ── */
const isValidRazorpaySignature = (razorpayOrderId, razorpayPaymentId, signature) => {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  return safeEqual(expected, signature);
};

/* ─────────────────────────────────────────────────────────
   POST /api/payment/razorpay/create-order
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

    const updated = await markOrderPaid(order, razorpay_payment_id, req.user.email, razorpay_order_id);
    res.json({ message: 'Payment verified', order: updated });
  } catch (err) {
    console.error('[Razorpay] verify error:', err.message);
    res.status(500).json({ message: 'Payment verification failed. Contact support.' });
  }
};

/* ─────────────────────────────────────────────────────────
   GET /api/payment/razorpay/order-status/:razorpayOrderId
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
   Backup path when the browser never reaches /verify.
   Raw body is configured in server.js BEFORE express.json().

   Dashboard events to enable: payment.captured, payment.failed
───────────────────────────────────────────────────────── */
const razorpayWebhook = async (req, res) => {
  try {
    const check = verifyWebhookSignature(req.body, req.headers['x-razorpay-signature']);
    if (!check.ok) {
      console.warn('[Razorpay webhook] rejected:', check.message);
      return res.status(check.status).json({ message: check.message });
    }

    const { event, payload } = JSON.parse(req.body.toString('utf8'));
    const payment = payload?.payment?.entity || {};
    console.log('[Razorpay webhook] event:', event, payment.id || '');

    if (event === 'payment.captured') {
      const rzpOrderId = payment.order_id;

      const order = rzpOrderId ? await Order.findOne({ razorpayOrderId: rzpOrderId }) : null;

      if (order) {
        // Amount must match what we charged, otherwise do not mark as paid
        if (Math.round(order.totalPrice * 100) !== payment.amount) {
          console.error('[Razorpay webhook] AMOUNT MISMATCH', {
            order: order._id.toString(), expected: Math.round(order.totalPrice * 100), got: payment.amount, payment: payment.id,
          });
          return res.json({ received: true });
        }
        await markOrderPaid(order, payment.id, payment.email || '', rzpOrderId);
        console.log(`[Razorpay webhook] Order ${order._id} confirmed paid`);
        return res.json({ received: true });
      }

      // No order yet: either /verify hasn't arrived (race) or the customer closed the tab.
      const ageMs = Date.now() - (payment.created_at || 0) * 1000;
      if (ageMs < ORPHAN_AFTER_MS) {
        // 5xx makes Razorpay retry later, by which time /verify may have created the order
        return res.status(503).json({ message: 'Order not created yet, retry later' });
      }

      console.error('[Razorpay webhook] ORPHAN PAYMENT — money captured, no order exists', {
        paymentId: payment.id, razorpayOrderId: rzpOrderId,
        amountInr: payment.amount / 100, email: payment.email, contact: payment.contact,
        userId: payment.notes?.userId,
      });
    }

    if (event === 'payment.failed') {
      console.warn('[Razorpay webhook] Payment failed:', {
        id: payment.id, razorpayOrderId: payment.order_id,
        errorCode: payment.error_code, errorReason: payment.error_reason,
      });
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[Razorpay webhook] error:', err.message);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getRazorpayOrderStatus,
  razorpayWebhook,
};