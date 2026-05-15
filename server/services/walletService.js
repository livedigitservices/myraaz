const Wallet = require('../models/Wallet');

/* Get or create wallet for user */
const getWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId, balance: 0 });
  }
  return wallet;
};

/* Credit wallet */
const creditWallet = async (userId, amount, description, orderId = null) => {
  const wallet = await getWallet(userId);
  wallet.balance += amount;
  wallet.transactions.push({
    type:        'credit',
    amount,
    description,
    orderId,
    status:      'completed',
  });
  await wallet.save();
  return wallet;
};

/* Debit wallet */
const debitWallet = async (userId, amount, description, orderId = null) => {
  const wallet = await getWallet(userId);
  if (wallet.balance < amount) {
    throw new Error('Insufficient wallet balance');
  }
  wallet.balance -= amount;
  wallet.transactions.push({
    type:        'debit',
    amount,
    description,
    orderId,
    status:      'completed',
  });
  await wallet.save();
  return wallet;
};

module.exports = { getWallet, creditWallet, debitWallet };