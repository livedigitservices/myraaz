const Razorpay = require('razorpay');
const { creditWallet } = require('./walletService');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ═══════════════════════════════════════
   calculateRefundAmount
   Rules:
     1. Shipping & delivery charges are NEVER refunded
        (service already rendered — parcel was delivered)
     2. Coupon discount is deducted proportionally
        e.g. ₹100 coupon on ₹500 order = 20% discount rate
             Returning ₹200 of items → refund = ₹200 × 80% = ₹160
     3. Refund can never be negative
═══════════════════════════════════════ */
const calculateRefundAmount = (order, returnItems) => {
  // Total value of items being returned at their original price
  const itemsTotal = returnItems.reduce(
    (sum, item) => sum + (item.price * item.quantity), 0
  );

  const orderItemsTotal = order.itemsPrice || order.totalPrice;
  const isPartial       = itemsTotal < orderItemsTotal;

  // Shipping is NEVER refunded — it was a logistics cost already spent
  const shippingRefund = 0;

  // Deduct coupon discount proportionally from the returned items
  const couponDiscount = order.coupon?.discountAmount || 0;
  let proportionalDiscount = 0;

  if (couponDiscount > 0 && orderItemsTotal > 0) {
    const returnFraction = itemsTotal / orderItemsTotal;
    proportionalDiscount = parseFloat((couponDiscount * returnFraction).toFixed(2));
  }

  const totalRefund = Math.max(
    0,
    parseFloat((itemsTotal - proportionalDiscount).toFixed(2))
  );

  return {
    itemsRefund:      itemsTotal,
    shippingRefund,                      // always 0
    couponDeduction:  proportionalDiscount,
    totalRefund,
    isPartial,
    // Human-readable breakdown for admin panel / emails
    breakdown: {
      itemsValue:       itemsTotal,
      shippingCharge:   order.shippingPrice || 0,
      shippingRefunded: false,
      couponDeducted:   proportionalDiscount,
      finalRefund:      totalRefund,
    },
  };
};

/* ═══════════════════════════════════════
   MAIN REFUND PROCESSOR
   Called when admin approves a return
═══════════════════════════════════════ */
const processRefund = async (returnDoc, order) => {
  console.log(`Processing refund for order ${order._id}`);
  console.log(`Payment method: ${order.paymentMethod}`);
  console.log(`Refund amount: ₹${returnDoc.refundAmount}`);
  console.log(`Refund method: ${returnDoc.refundMethod}`);

  try {

    /* ════════════════════════════════════
       CASE 1: RAZORPAY
       Money goes back to original payment source automatically
    ════════════════════════════════════ */
    if (order.paymentMethod === 'Razorpay') {
      const paymentId = order.paymentResult?.id;

      if (!paymentId)
        throw new Error('Razorpay payment ID not found in order');

      const refund = await razorpay.payments.refund(paymentId, {
        amount: Math.round(returnDoc.refundAmount * 100), // paise
        speed:  'normal',
        notes: {
          orderId:  order._id.toString(),
          returnId: returnDoc._id.toString(),
          reason:   returnDoc.reason,
        },
      });

      return {
        success:  true,
        method:   'razorpay',
        refundId: refund.id,
        message:  `Refund of ₹${returnDoc.refundAmount} initiated via Razorpay. Will reach customer in 5–7 business days.`,
        details:  refund,
      };
    }

    /* ════════════════════════════════════
       CASE 2: WALLET PAYMENT
       Credit back to myRaaz wallet
    ════════════════════════════════════ */
    if (order.paymentMethod === 'Wallet') {
      const wallet = await creditWallet(
        order.user,
        returnDoc.refundAmount,
        `Refund for order #${order._id.toString().slice(-8).toUpperCase()}`,
        order._id,
      );

      return {
        success:  true,
        method:   'wallet',
        refundId: `wallet_${Date.now()}`,
        message:  `₹${returnDoc.refundAmount} credited to myRaaz wallet instantly.`,
        details:  { walletBalance: wallet.balance },
      };
    }

    /* ════════════════════════════════════
       CASE 3: COD
       User paid cash — choose refund method
    ════════════════════════════════════ */
    if (order.paymentMethod === 'COD') {
      const refundMethod = returnDoc.refundMethod;

      // Option A: Wallet (default / recommended)
      if (refundMethod === 'wallet' || !refundMethod) {
        const wallet = await creditWallet(
          order.user,
          returnDoc.refundAmount,
          `COD Refund for order #${order._id.toString().slice(-8).toUpperCase()}`,
          order._id,
        );
        return {
          success:  true,
          method:   'wallet_cod',
          refundId: `cod_wallet_${Date.now()}`,
          message:  `₹${returnDoc.refundAmount} credited to myRaaz wallet.`,
          details:  { walletBalance: wallet.balance },
        };
      }

      // Option B: UPI Payout via Razorpay X
      if (refundMethod === 'upi' && returnDoc.upiId) {
        try {
          const payout = await processRazorpayPayout({
            upiId:    returnDoc.upiId,
            amount:   returnDoc.refundAmount,
            orderId:  order._id.toString(),
            returnId: returnDoc._id.toString(),
          });
          return {
            success:  true,
            method:   'upi_payout',
            refundId: payout.id,
            message:  `₹${returnDoc.refundAmount} sent to UPI ${returnDoc.upiId}`,
            details:  payout,
          };
        } catch (payoutErr) {
          console.error('UPI payout failed, falling back to wallet:', payoutErr.message);
          const wallet = await creditWallet(
            order.user,
            returnDoc.refundAmount,
            `COD Refund (UPI failed) for order #${order._id.toString().slice(-8).toUpperCase()}`,
            order._id,
          );
          return {
            success:  true,
            method:   'wallet_fallback',
            refundId: `fallback_${Date.now()}`,
            message:  `UPI payout failed. ₹${returnDoc.refundAmount} credited to wallet instead.`,
            details:  { walletBalance: wallet.balance },
          };
        }
      }

      // Option C: Bank transfer — mark for manual admin transfer
      if (refundMethod === 'bank' && returnDoc.bankDetails?.accountNumber) {
        return {
          success:                true,
          method:                 'bank_pending',
          refundId:               `bank_${Date.now()}`,
          message:                `Bank transfer of ₹${returnDoc.refundAmount} marked for manual processing.`,
          requiresManualTransfer: true,
          bankDetails:            returnDoc.bankDetails,
        };
      }

      // Default COD fallback — wallet
      const wallet = await creditWallet(
        order.user,
        returnDoc.refundAmount,
        `COD Refund for order #${order._id.toString().slice(-8).toUpperCase()}`,
        order._id,
      );
      return {
        success:  true,
        method:   'wallet_cod',
        refundId: `cod_${Date.now()}`,
        message:  `₹${returnDoc.refundAmount} credited to myRaaz wallet.`,
        details:  { walletBalance: wallet.balance },
      };
    }

    throw new Error(`Unknown payment method: ${order.paymentMethod}`);

  } catch (err) {
    console.error('Refund processing failed:', err.message);
    return {
      success: false,
      method:  order.paymentMethod,
      error:   err.message,
      message: `Refund failed: ${err.message}`,
    };
  }
};

/* ════════════════════════════════════
   RAZORPAY PAYOUT API (COD → UPI)
   Requires Razorpay X account
════════════════════════════════════ */
const processRazorpayPayout = async ({ upiId, amount, orderId, returnId }) => {
  const auth = Buffer
    .from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`)
    .toString('base64');

  const response = await fetch('https://api.razorpay.com/v1/payouts', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: JSON.stringify({
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
      fund_account: {
        account_type: 'vpa',
        vpa:          { address: upiId },
        contact: {
          name:         'Customer Refund',
          type:         'customer',
          reference_id: returnId,
        },
      },
      amount:               Math.round(amount * 100),
      currency:             'INR',
      mode:                 'UPI',
      purpose:              'refund',
      queue_if_low_balance: true,
      reference_id:         orderId,
      narration:            `Refund for order ${orderId.slice(-8)}`,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.description || 'Razorpay payout failed');

  return data;
};

module.exports = { processRefund, calculateRefundAmount };