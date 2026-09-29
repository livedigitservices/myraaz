/**
 * utils/razorpaySignature.js
 * Shared, fail-closed Razorpay webhook signature check.
 * Used by paymentController (payments) and returnController (refunds).
 */
const crypto = require('crypto');

const verifyWebhookSignature = (rawBody, signature) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // Fail closed: without a secret we cannot tell real events from fake ones
  if (!secret)
    return { ok: false, status: 503, message: 'Webhook secret not configured' };
  if (!signature)
    return { ok: false, status: 400, message: 'Missing webhook signature' };
  if (!Buffer.isBuffer(rawBody))
    return { ok: false, status: 400, message: 'Raw body required for signature check' };

  const expected = Buffer.from(
    crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  );
  const received = Buffer.from(String(signature));

  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received))
    return { ok: false, status: 400, message: 'Invalid webhook signature' };

  return { ok: true };
};

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

module.exports = { verifyWebhookSignature, safeEqual };