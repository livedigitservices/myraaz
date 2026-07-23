const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

// Validate critical env vars at startup
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error('❌ Missing required environment variables:', missing.join(', '));
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET must be at least 32 characters long');
  process.exit(1);
}
if (!process.env.RAZORPAY_WEBHOOK_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  RAZORPAY_WEBHOOK_SECRET is not set — webhook signature verification is disabled!');
}

connectDB();

const app = express();

const allowedOrigins = [
  'https://www.myraaz.in',
  'https://myraaz.in',
  'https://my-raaz-ecommerce-frontend.vercel.app',
  'http://localhost:5173',
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, server-to-server, Postman)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  methods:      ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials:  true,
};

app.options('/{*path}', cors(corsOptions));
app.use(cors(corsOptions));

// Raw body for Razorpay webhooks — MUST come before express.json()
app.use('/api/payment/webhook/razorpay', express.raw({ type: 'application/json' }));
app.use('/api/returns/webhook/razorpay', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10kb' })); // limit body size

// Routes
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/products',      require('./routes/productRoutes'));
app.use('/api/wishlist',      require('./routes/wishlistRoutes'));
app.use('/api/cart',          require('./routes/cartRoutes'));
app.use('/api/orders',        require('./routes/orderRoutes'));
app.use('/api/users',         require('./routes/userRoutes'));
app.use('/api/payment',       require('./routes/paymentRoutes'));
app.use('/api/coupons',       require('./routes/couponRoutes'));
app.use('/api/returns',       require('./routes/returnRoutes'));
app.use('/api/wallet',        require('./routes/walletRoutes'));
app.use('/api/home-media',    require('./routes/homeMediaRoutes'));
app.use('/api/home-featured', require('./routes/homeFeaturedRoutes'));
app.use('/api/delivery',      require('./routes/deliveryRoutes'));

app.get('/', (req, res) => res.send('myRaaz API is running 🌿'));

// Global error handler
app.use((err, req, res, next) => {
  if (err.message?.startsWith('CORS blocked')) {
    console.warn(err.message);
    return res.status(403).json({ message: 'Origin not allowed by CORS policy' });
  }
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`));