const User  = require('../models/User');
const Return = require('../models/Return');
const Order  = require('../models/Order');

const FRAUD_THRESHOLDS = {
  maxReturnsPerMonth: 3,
  maxReturnRate:      0.5,  // 50% of orders
  minOrderAge:        0,    // days before return allowed
};

const checkFraud = async (userId, orderId) => {
  const flags = [];

  /* Check return count this month */
  const oneMonthAgo  = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentReturns = await Return.countDocuments({
    user:      userId,
    createdAt: { $gte: oneMonthAgo },
  });

  if (recentReturns >= FRAUD_THRESHOLDS.maxReturnsPerMonth) {
    flags.push({
      type:      'too_many_returns',
      reason:    `${recentReturns} returns in last 30 days`,
      flaggedAt: new Date(),
    });
  }

  /* Check overall return rate */
  const totalOrders  = await Order.countDocuments({ user: userId, status: 'delivered' });
  const totalReturns = await Return.countDocuments({ user: userId });

  if (totalOrders > 2 && totalReturns / totalOrders > FRAUD_THRESHOLDS.maxReturnRate) {
    flags.push({
      type:      'high_return_rate',
      reason:    `${Math.round((totalReturns / totalOrders) * 100)}% return rate`,
      flaggedAt: new Date(),
    });
  }

  /* Check user fraud status */
  const user = await User.findById(userId);
  if (user.isFraudSuspect) {
    flags.push({
      type:      'flagged_user',
      reason:    'User is flagged for suspicious activity',
      flaggedAt: new Date(),
    });
  }

  return {
    isFraud:              flags.length > 0,
    requiresManualReview: flags.length > 0,
    flags,
  };
};

module.exports = { checkFraud };