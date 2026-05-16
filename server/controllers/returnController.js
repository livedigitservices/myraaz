/**
 * returnController.js
 *
 * getUserWallet has been removed — wallet lives at GET /api/wallet.
 * All wallet refunds go through walletService.refundToWallet (via refundService).
 */

const Return   = require('../models/Return');
const Order    = require('../models/Order');
const Product  = require('../models/Product');
const User     = require('../models/User');
const { checkFraud }                          = require('../services/fraudService');
const { processRefund, calculateRefundAmount } = require('../services/refundService');

/* ─────────────────────────────────────────
   GET /api/returns/eligibility/:orderId
───────────────────────────────────────── */
const checkEligibility = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order)
      return res.status(404).json({ message: 'Order not found' });

    if (order.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    if (order.status !== 'delivered')
      return res.json({ eligible: false, message: 'Only delivered orders can be returned', items: [] });

    const existing = await Return.findOne({ order: order._id });
    if (existing)
      return res.json({
        eligible: false,
        message:  'Return already requested for this order',
        existing: {
          status:       existing.status,
          refundAmount: existing.refundAmount,
          refundMethod: existing.refundMethod,
          adminNote:    existing.adminNote,
        },
        items: [],
      });

    const productIds = order.orderItems.map(i => i.product).filter(Boolean);
    const products   = await Product.find({ _id: { $in: productIds } });
    const productMap = {};
    products.forEach(p => { productMap[p._id.toString()] = p; });

    const deliveredAt = new Date(order.deliveredAt || order.updatedAt);

    const items = order.orderItems.map(item => {
      const product    = productMap[item.product?.toString()];
      const returnable = product?.returnPolicy?.returnable ?? true;
      const returnDays = product?.returnPolicy?.returnDays ?? 7;
      const policyNote = product?.returnPolicy?.description || '';
      const daysSince  = (Date.now() - deliveredAt) / (1000 * 60 * 60 * 24);
      const daysLeft   = Math.max(0, Math.ceil(returnDays - daysSince));
      const inWindow   = daysSince <= returnDays;

      let eligible = true;
      let reason   = null;

      if (!returnable) {
        eligible = false;
        reason   = policyNote || 'This product is non-returnable';
      } else if (!inWindow) {
        eligible = false;
        reason   = `Return window expired (${returnDays}-day policy)`;
      }

      return {
        productId: item.product, name: item.name, image: item.image,
        price: item.price, quantity: item.quantity,
        eligible, reason, returnDays, daysLeft,
      };
    });

    const eligibleItems   = items.filter(i => i.eligible);
    const hasEligible     = eligibleItems.length > 0;
    const refundBreakdown = hasEligible ? calculateRefundAmount(order, eligibleItems) : null;

    res.json({
      eligible:       hasEligible,
      message:        hasEligible ? 'Items eligible for return' : 'No returnable items',
      deliveredAt,
      paymentMethod:  order.paymentMethod,
      items,
      refundBreakdown,
    });
  } catch (err) {
    console.error('checkEligibility error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   POST /api/returns/:orderId
───────────────────────────────────────── */
const requestReturn = async (req, res) => {
  try {
    const { reason, description, selectedItems, refundMethod, upiId, bankDetails } = req.body;

    if (!reason)
      return res.status(400).json({ message: 'Please provide a reason' });

    const order = await Order.findById(req.params.orderId);
    if (!order)
      return res.status(404).json({ message: 'Order not found' });

    if (order.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    if (order.status !== 'delivered')
      return res.status(400).json({ message: 'Only delivered orders can be returned' });

    const existing = await Return.findOne({ order: order._id });
    if (existing)
      return res.status(400).json({ message: 'Return already requested' });

    const productIds = order.orderItems.map(i => i.product).filter(Boolean);
    const products   = await Product.find({ _id: { $in: productIds } });
    const productMap = {};
    products.forEach(p => { productMap[p._id.toString()] = p; });

    const deliveredAt    = new Date(order.deliveredAt || order.updatedAt);
    const returnItems    = [];
    const nonReturnItems = [];

    for (const item of order.orderItems) {
      if (selectedItems && !selectedItems.includes(item.product?.toString())) continue;

      const product    = productMap[item.product?.toString()];
      const returnable = product?.returnPolicy?.returnable ?? true;
      const returnDays = product?.returnPolicy?.returnDays ?? 7;
      const daysSince  = (Date.now() - deliveredAt) / (1000 * 60 * 60 * 24);

      if (!returnable) {
        nonReturnItems.push({ name: item.name, reason: product?.returnPolicy?.description || 'Non-returnable product' });
      } else if (daysSince > returnDays) {
        nonReturnItems.push({ name: item.name, reason: `Return window expired (${returnDays} days)` });
      } else {
        returnItems.push({
          product: item.product, name: item.name, image: item.image,
          price: item.price, quantity: item.quantity, reason,
        });
      }
    }

    if (returnItems.length === 0)
      return res.status(400).json({ message: 'No eligible items to return', nonReturnItems });

    const fraudCheck = await checkFraud(req.user._id, order._id);
    const { totalRefund, isPartial } = calculateRefundAmount(order, returnItems);

    // COD: user chooses upi/bank/wallet; all other methods default to wallet
    let finalRefundMethod = 'wallet';
    if (order.paymentMethod === 'COD') {
      finalRefundMethod = upiId ? 'upi' : bankDetails ? 'bank' : 'wallet';
    } else if (refundMethod) {
      finalRefundMethod = refundMethod;
    }

    const returnDoc = await Return.create({
      order: order._id, user: req.user._id, returnItems, nonReturnItems,
      reason, description: description || '',
      refundMethod: finalRefundMethod,
      refundAmount: totalRefund,
      partialRefund: isPartial,
      upiId:       upiId       || '',
      bankDetails: bankDetails || {},
      fraudFlags:              fraudCheck.flags,
      requiresManualReview:    fraudCheck.requiresManualReview,
      status: 'pending',
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { returnCount: 1 } });

    order.returnRequest = {
      requested:   true,
      reason,
      requestedAt: new Date(),
      status:      'pending',
    };
    await order.save();

    res.status(201).json({
      message: fraudCheck.requiresManualReview
        ? 'Return request submitted. Under manual review due to account activity.'
        : 'Return request submitted successfully',
      return:               returnDoc,
      refundAmount:         totalRefund,
      isPartial,
      requiresManualReview: fraudCheck.requiresManualReview,
    });
  } catch (err) {
    console.error('requestReturn error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   GET /api/returns/admin
───────────────────────────────────────── */
const getAllReturns = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const total   = await Return.countDocuments(query);
    const returns = await Return.find(query)
      .populate('user', 'name email phone returnCount isFraudSuspect')
      .populate({
        path:     'order',
        select:   'totalPrice paymentMethod paymentResult orderItems shippingAddress',
        populate: {
          path:   'orderItems.product',
          select: 'name images price',
        },
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const shaped = returns.map(ret => {
      const order = ret.order || {};

      const orderItems = (order.orderItems || []).map(item => ({
        name:     item.name     || item.product?.name        || 'Product',
        price:    item.price    ?? item.product?.price       ?? 0,
        image:    item.image    || item.product?.images?.[0] || '',
        quantity: item.quantity || 1,
        product:  item.product,
      }));

      return {
        _id:             ret._id,
        user:            ret.user,
        orderItems,
        totalPrice:      order.totalPrice,
        shippingAddress: order.shippingAddress,
        paymentMethod:   order.paymentMethod,
        refundMethod:    ret.refundMethod,
        refundAmount:    ret.refundAmount,
        partialRefund:   ret.partialRefund,
        requiresManualReview: ret.requiresManualReview,
        fraudFlags:      ret.fraudFlags,
        upiId:           ret.upiId,
        bankDetails:     ret.bankDetails,
        returnRequest: {
          status:             ret.status,
          reason:             ret.reason,
          requestedAt:        ret.createdAt,
          adminNote:          ret.adminNote,
          returnableItems:    (ret.returnItems    || []).map(i => i.name),
          nonReturnableItems: (ret.nonReturnItems || []).map(i => i.name),
        },
      };
    });

    res.json({ returns: shaped, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('getAllReturns error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   PUT /api/returns/admin/:returnId
───────────────────────────────────────── */
const handleReturn = async (req, res) => {
  try {
    const { status, adminNote, refundMethod } = req.body;

    if (!['approved', 'rejected'].includes(status))
      return res.status(400).json({ message: 'Invalid status. Use approved or rejected.' });

    const returnDoc = await Return.findById(req.params.returnId).populate('order');
    if (!returnDoc)
      return res.status(404).json({ message: 'Return request not found' });

    if (returnDoc.status !== 'pending')
      return res.status(400).json({ message: `Return already processed (status: ${returnDoc.status})` });

    returnDoc.adminNote  = adminNote || '';
    returnDoc.resolvedAt = new Date();
    returnDoc.resolvedBy = req.user._id;

    if (status === 'rejected') {
      returnDoc.status = 'rejected';
      await Order.findByIdAndUpdate(returnDoc.order._id, {
        'returnRequest.status':    'rejected',
        'returnRequest.adminNote': adminNote,
      });
      await returnDoc.save();
      return res.json({ message: 'Return rejected', return: returnDoc });
    }

    // ── Approved: process refund ──────────────────────────────────────
    returnDoc.status       = 'refund_initiated';
    returnDoc.refundMethod = refundMethod || returnDoc.refundMethod;
    await returnDoc.save();

    const refundResult = await processRefund(returnDoc, returnDoc.order);

    returnDoc.status = refundResult.success ? 'refund_completed' : 'refund_failed';
    if (refundResult.success) {
      returnDoc.gatewayRefundId = refundResult.refundId;
    } else {
      returnDoc.adminNote += ` | Refund failed: ${refundResult.error}`;
    }
    await returnDoc.save();

    // Update order status
    const order = await Order.findById(returnDoc.order._id);
    if (order) {
      order.status        = returnDoc.partialRefund ? 'delivered' : 'returned';
      order.returnRequest = {
        requested:   true,
        reason:      returnDoc.reason,
        requestedAt: returnDoc.createdAt,
        status:      refundResult.success ? 'approved' : 'rejected',
        adminNote:   returnDoc.adminNote,
      };
      await order.save();
    }

    res.json({
      message: refundResult.success
        ? `Return approved. Refund of ₹${returnDoc.refundAmount} processed via ${refundResult.method}.`
        : 'Return approved but refund failed. Please process manually.',
      return: returnDoc,
      refundResult,
    });
  } catch (err) {
    console.error('handleReturn error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   GET /api/returns/my
───────────────────────────────────────── */
const getMyReturns = async (req, res) => {
  try {
    const returns = await Return.find({ user: req.user._id })
      .populate('order', 'totalPrice paymentMethod orderItems')
      .sort({ createdAt: -1 });
    res.json(returns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   POST /api/returns/webhook/razorpay
───────────────────────────────────────── */
const handleRazorpayWebhook = async (req, res) => {
  try {
    const { event, payload } = req.body;
    console.log('Return webhook event:', event);

    const refundId = payload?.refund?.entity?.id;
    if (refundId && ['refund.processed', 'refund.completed', 'refund.failed'].includes(event)) {
      const returnDoc = await Return.findOne({ gatewayRefundId: refundId });
      if (returnDoc) {
        returnDoc.status = event === 'refund.failed' ? 'refund_failed' : 'refund_completed';
        returnDoc.webhookEvents.push({ event, data: payload, receivedAt: new Date() });
        await returnDoc.save();
      }
    }

    res.json({ received: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  checkEligibility,
  requestReturn,
  getAllReturns,
  handleReturn,
  getMyReturns,
  handleRazorpayWebhook,
  // ❌ getUserWallet removed — lives at GET /api/wallet via walletController
};