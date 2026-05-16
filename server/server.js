const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// Razorpay webhook needs raw body — must come BEFORE express.json()
app.use('/api/payment/webhook/razorpay', express.raw({ type: 'application/json' }));

app.use(cors());
app.use(express.json());

app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/cart',     require('./routes/cartRoutes'));
app.use('/api/orders',   require('./routes/orderRoutes'));
app.use('/api/users',    require('./routes/userRoutes'));
app.use('/api/payment',  require('./routes/paymentRoutes'));
app.use('/api/coupons',  require('./routes/couponRoutes'));
app.use('/api/returns',  require('./routes/returnRoutes'));
app.use('/api/wallet',      require('./routes/walletRoutes'));
app.use('/api/home-media', require('./routes/homeMediaRoutes'));

app.get('/', (req, res) => res.send('Hair Store API is running! 🌿'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));