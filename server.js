const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');
const config = require('./config/environment');

// Import database configuration
const { testConnection, syncDatabase } = require('./config/db');

// Import routes
const supplierRoutes = require('./app/routes/supplierRoutes');
const authRoutes = require('./app/routes/authRoutes');
const userRoutes = require('./app/routes/userRoutes');
const purchaseRoutes = require('./app/routes/purchaseRoutes');
const saleRoutes = require('./app/routes/saleRoutes');
const invoiceRoutes = require('./app/routes/invoiceRoutes');

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Rice Mill Management API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: 'Connected',
    endpoints: {
      suppliers: '/api/suppliers',
      purchases: '/api/purchases',
      sales: '/api/sales',
      invoices: '/api/invoices',
      users: '/api/users'
    }
  });
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Rice Mill Management API Documentation'
}));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/invoices', invoiceRoutes);

// Root endpoint
/**
 * @swagger
 * /:
 *   get:
 *     summary: Welcome endpoint with API documentation links
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Welcome message with API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Welcome to Rice Mill Management API"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 documentation:
 *                   type: object
 *                   properties:
 *                     swagger_ui:
 *                       type: string
 *                       example: "/api-docs"
 *                     endpoints:
 *                       type: object
 */
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🌾 Welcome to Rice Mill Management API',
    version: '1.0.0',
    documentation: {
      swagger_ui: '/api-docs',
      postman_collection: 'Available via Swagger export',
      endpoints: {
        auth: '/api/auth',
        users: '/api/users',
        suppliers: '/api/suppliers',
        purchases: '/api/purchases',
        sales: '/api/sales',
        invoices: '/api/invoices',
        health: '/health'
      }
    },
    features: [
      'Complete CRUD operations for all entities',
      'Authentication & Authorization',
      'Business logic calculations',
      'Statistical analytics',
      'Comprehensive validation',
      'API documentation via Swagger'
    ]
  });
});

// 404 handler - must be last route
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Handle JSON parsing errors
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body',
    });
  }

  // Handle other errors
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: error.message }),
  });
});

// Server configuration
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Start server function (returns the http server instance)
const startServer = async (opts = {}) => {
  try {
    // Test database connection
    console.log('🔗 Testing database connection...');
    await testConnection();
    
    // Sync database models
    console.log('🔄 Syncing database...');
    await syncDatabase();
    
    // Start the server
    const PORT = opts.port != null ? opts.port : config.server.port;
    const HOST = opts.host || config.server.host;
    
    const srv = app.listen(PORT, HOST, () => {
      console.log('🌾 Rice Mill Management API Started Successfully!');
      console.log(`🚀 Server running on: ${config.getBaseUrl()}`);
      console.log(`📋 API Documentation: ${config.getBaseUrl()}/api-docs`);
      console.log(`� Health Check: ${config.getBaseUrl()}/health`);
      console.log(`🏠 Frontend URL: ${config.frontend.url}`);
      console.log(`🌍 Environment: ${config.server.nodeEnv}`);
      console.log('� Available endpoints:');
      console.log(`   - Suppliers: ${config.getApiBaseUrl()}/suppliers`);
      console.log(`   - Purchases: ${config.getApiBaseUrl()}/purchases`);
      console.log(`   - Sales: ${config.getApiBaseUrl()}/sales`);
      console.log(`   - Invoices: ${config.getApiBaseUrl()}/invoices`);
      console.log(`   - Users: ${config.getApiBaseUrl()}/users`);
      console.log('✅ Ready to accept connections!');
  });
  return srv;
  } catch (error) {
    if (error.name === 'SequelizeConnectionRefusedError') {
      console.error('❌ Database connection failed - starting server without DB');
      console.error('⚠️  Some endpoints may not work until database is available\n');
      
  const PORT = opts.port != null ? opts.port : config.server.port;
  const HOST = opts.host || config.server.host;
      
      // Start server anyway in development mode
      const srv = app.listen(PORT, HOST, () => {
        console.log('🚀 =================================');
        console.log(`🚀 Server running on ${config.getBaseUrl()}`);
        console.log(`🚀 Environment: ${config.server.nodeEnv}`);
        console.log('🚨 Status: Database Disconnected');
        console.log('🚀 =================================');
        console.log('📚 Available Endpoints:');
        console.log(`🔗 Health Check: ${config.getBaseUrl()}/health`);
        console.log('🚀 =================================');
  });
  return srv;
    } else {
      console.error('❌ Failed to start server:', error.message);
      process.exit(1);
    }
  }
};

// Only auto-start if this file is run directly and not under test
if (require.main === module && process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, startServer };

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
// (Removed direct call; guarded above)

// (Single export object defined above)