require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const { connectDB }       = require('./src/config/db');
const errorHandler        = require('./src/middleware/errorHandler');
const { apiLimiter }      = require('./src/middleware/rateLimiter');
const { seedUsers }       = require('./src/scripts/seedUsers');

const authRoutes      = require('./src/routes/auth.routes');
const productRoutes   = require('./src/routes/products.routes');
const batchRoutes     = require('./src/routes/batches.routes');
const dispatchRoutes  = require('./src/routes/dispatch.routes');
const qrRoutes        = require('./src/routes/qr.routes');
const aiRoutes        = require('./src/routes/ai.routes');

const app  = express();
const PORT = process.env.PORT || 5001;

app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5174',
    ].filter(Boolean);
    // Allow any vercel.app subdomain
    if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS: Origin ' + origin + ' not allowed'));
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(apiLimiter);

// Routes
app.use('/auth', authRoutes);
app.use('/trace', qrRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/products', productRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/ai', aiRoutes);

// Error Handler
app.use(errorHandler);

// Start server
connectDB().then(async () => {
  try {
    await seedUsers();
  } catch (e) {
    console.warn('Seed users skipped:', e.message);
  }
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
