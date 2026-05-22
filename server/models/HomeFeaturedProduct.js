// models/HomeFeaturedProduct.js
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
}, { timestamps: true });
module.exports = mongoose.model('HomeFeaturedProduct', schema);