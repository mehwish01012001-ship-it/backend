const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const couponRoutes = require('./routes/couponRoutes');
const compareRoutes = require('./routes/compareRoutes');
const customerRoutes = require('./routes/customerRoutes');
const heroSliderRoutes = require('./routes/heroSliderRoutes');

const app = express();

// When deployed behind proxy hosts (Railway, Vercel, etc.), trust X-Forwarded-* headers
app.set('trust proxy', 1);

// Security middleware - allow cross-origin resource policy for static uploads
app.use(
  helmet({
    // disable CSP here to avoid interfering with inline dev setup
    contentSecurityPolicy: false,
    // allow embedding resources (images) from other origins
    crossOriginEmbedderPolicy: false,
    // allow resources (images) to be loaded cross-origin
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
});
app.use('/api/', limiter);

// CORS (use centralized options that validate allowed origins)
const { corsOptions } = require('./config/cors');
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Cookie parser
app.use(cookieParser());

// Compression
app.use(compression());

// Logging
app.use(morgan('combined'));

// Serve static files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/hero-slider', heroSliderRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

app.get('/api/brand-story', (req, res) => {
  res.status(200).json({
    title: 'Luxury Fashion, Crafted with Purpose',
    subtitle: 'Premium Womens Stitched Collections',
    paragraph:
      'RQ Fashion presents timeless silhouettes, premium fabrics, and refined craftsmanship for women who embrace confidence, elegance, and effortless style every day.',
    stats: [
      { iconKey: 'users', value: '10K+', label: 'Happy Clients' },
      { iconKey: 'award', value: '4.9/5', label: 'Average Rating' },
      { iconKey: 'star', value: '100%', label: 'Premium Quality' },
    ],
    banners: [
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',
    ],
    floatingCard: {
      title: 'Limited Edition',
      subtitle: 'Exclusive seasonal drops',
    },
    buttons: {
      primary: { label: 'Explore Collections', url: '/shop' },
      secondary: { label: 'View Lookbook', url: '/shop' },
    },
    seo: {
      metaTitle: 'Premium Women\'s Stitched Clothing | RQ Fashion',
      metaDescription: 'Discover luxury women\'s stitched collections designed with modern elegance, contemporary style, and premium fabrics.',
      metaKeywords: 'womens stitched luxury clothing, premium pret, designer stitched dresses',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
