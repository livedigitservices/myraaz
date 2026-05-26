const Razorpay = require('razorpay');
const { creditWallet } = require('./walletService');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


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
       User paid via Razorpay (UPI/Card/Netbanking)
       Money goes back to their original payment source
       automatically — no user bank details needed
    ════════════════════════════════════ */
    if (order.paymentMethod === 'Razorpay') {
      const paymentId = order.paymentResult?.id;

      if (!paymentId)
        throw new Error('Razorpay payment ID not found in order');

      console.log(`Initiating Razorpay refund for payment: ${paymentId}`);

      const refund = await razorpay.payments.refund(paymentId, {
        amount: Math.round(returnDoc.refundAmount * 100), // convert to paise
        speed:  'normal', // 'normal' = 5-7 days, 'optimum' = instant (extra fee)
        notes: {
          orderId:   order._id.toString(),
          returnId:  returnDoc._id.toString(),
          reason:    returnDoc.reason,
        },
      });

      console.log(`Razorpay refund created: ${refund.id}`);

      return {
        success:  true,
        method:   'razorpay',
        refundId: refund.id,
        message:  `Refund of ₹${returnDoc.refundAmount} initiated via Razorpay. Will reach user in 5-7 business days.`,
        details:  refund,
      };
    }


    /* ════════════════════════════════════
       CASE 3: WALLET PAYMENT
       User paid from myRaaz wallet
       Just credit back to their wallet
    ════════════════════════════════════ */
    if (order.paymentMethod === 'Wallet') {
      const wallet = await creditWallet(
        order.user,
        returnDoc.refundAmount,
        `Refund for order #${order._id.toString().slice(-8).toUpperCase()}`,
        order._id,
      );

      console.log(`Wallet refund completed: ₹${returnDoc.refundAmount}`);

      return {
        success:  true,
        method:   'wallet',
        refundId: `wallet_${Date.now()}`,
        message:  `₹${returnDoc.refundAmount} credited to myRaaz wallet instantly.`,
        details:  { walletBalance: wallet.balance },
      };
    }

    /* ════════════════════════════════════
       CASE 4: COD
       User paid cash on delivery
       NO digital payment to reverse
       Options:
         A) Credit to myRaaz wallet (easiest)
         B) Transfer to UPI (admin does manually OR via payout API)
         C) Bank transfer (admin does manually OR via payout API)
    ════════════════════════════════════ */
    if (order.paymentMethod === 'COD') {
      const refundMethod = returnDoc.refundMethod;

      /* Option A: Wallet credit (recommended for COD) */
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
          message:  `₹${returnDoc.refundAmount} credited to myRaaz wallet. Can be used for future orders.`,
          details:  { walletBalance: wallet.balance },
        };
      }

      /* Option B: UPI Payout via Razorpay Payout API */
      if (refundMethod === 'upi' && returnDoc.upiId) {
        try {
          const payout = await processRazorpayPayout({
            upiId:       returnDoc.upiId,
            amount:      returnDoc.refundAmount,
            orderId:     order._id.toString(),
            returnId:    returnDoc._id.toString(),
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
          /* Fallback to wallet if UPI payout fails */
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

      /* Option C: Bank transfer — mark as pending manual transfer */
      if (refundMethod === 'bank' && returnDoc.bankDetails?.accountNumber) {
        /* In production — use Razorpay Payouts or manual bank transfer */
        /* For now mark as pending and admin transfers manually */
        return {
          success:      true,
          method:       'bank_pending',
          refundId:     `bank_${Date.now()}`,
          message:      `Bank transfer of ₹${returnDoc.refundAmount} marked for manual processing.`,
          requiresManualTransfer: true,
          bankDetails:  returnDoc.bankDetails,
        };
      }

      /* Default COD fallback — wallet */
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
   RAZORPAY PAYOUT API
   For COD orders where user gives UPI
   Requires Razorpay X (business account)
════════════════════════════════════ */
const processRazorpayPayout = async ({ upiId, amount, orderId, returnId }) => {
  /* This requires Razorpay X account
     Free to set up at razorpay.com/x
     Allows you to send money to any UPI/bank */
  const axios = require('axios');

  const response = await axios.post(
    'https://api.razorpay.com/v1/payouts',
    {
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER, // your RazorpayX account
      fund_account: {
        account_type: 'vpa', // VPA = UPI ID
        vpa:          { address: upiId },
        contact: {
          name:    'Customer Refund',
          type:    'customer',
          reference_id: returnId,
        },
      },
      amount:   Math.round(amount * 100),
      currency: 'INR',
      mode:     'UPI',
      purpose:  'refund',
      queue_if_low_balance: true,
      reference_id: orderId,
      narration:    `Refund for order ${orderId.slice(-8)}`,
    },
    {
      auth: {
        username: process.env.RAZORPAY_KEY_ID,
        password: process.env.RAZORPAY_KEY_SECRET,
      },
    }
  );

  return response.data;
};

/* Calculate partial refund */
const calculateRefundAmount = (order, returnItems) => {
  const itemsTotal = returnItems.reduce((sum, item) =>
    sum + (item.price * item.quantity), 0
  );

  const orderItemsTotal = order.itemsPrice || order.totalPrice;
  const isPartial       = itemsTotal < orderItemsTotal;

  /* Only refund shipping if returning ALL items */
  const shippingRefund  = !isPartial && (order.shippingPrice || 0) > 0
    ? order.shippingPrice
    : 0;

  return {
    itemsRefund:   itemsTotal,
    shippingRefund,
    totalRefund:   itemsTotal + shippingRefund,
    isPartial,
  };
};

module.exports = { processRefund, calculateRefundAmount };