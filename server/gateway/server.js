require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/auth.routes');
const assessmentRoutes = require('./routes/assessment.routes');
const aiRoutes = require('./routes/ai.routes');
const errorHandler = require('./utils/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// ============================================
// HEALTH CHECK & INFO
// ============================================

app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'API Gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      auth: process.env.AUTH_SERVICE_URL,
      ai: process.env.AI_SERVICE_URL,
      assessment: process.env.ASSESSMENT_SERVICE_URL
    }
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'PathPilot API Gateway',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth/*',
      assessments: '/api/assessments/*',
      ai: {
        streams: '/api/streams/*',
        careers: '/api/careers/*',
        colleges: '/api/colleges/*',
        recommendations: '/api/ai/*'
      }
    }
  });
});

// ============================================
// ROUTES
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api', aiRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error handler
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log('='.repeat(50));
  console.log('📡 Microservices:');
  console.log(`   Auth Service:       ${process.env.AUTH_SERVICE_URL}`);
  console.log(`   AI Service:         ${process.env.AI_SERVICE_URL}`);
  console.log(`   Assessment Service: ${process.env.ASSESSMENT_SERVICE_URL}`);
  console.log('='.repeat(50));
  console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
  console.log(`❤️  Health Check:      http://localhost:${PORT}/health`);
  console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
