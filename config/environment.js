const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'),
    nodeEnv: process.env.NODE_ENV || 'development'
  },

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'ricemill_db',
    user: process.env.DB_USER || 'hafis',
    password: process.env.DB_PASSWORD || '',
    dialect: process.env.DB_DIALECT || 'postgres'
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-default-secret-change-this',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  // CORS Configuration
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',') : 
      ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080']
  },

  // API Configuration
  api: {
    version: process.env.API_VERSION || 'v1',
    prefix: process.env.API_PREFIX || '/api'
  },

  // Frontend Configuration
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000'
  },

  // Get base URL for current environment
  getBaseUrl: function() {
    const protocol = this.server.nodeEnv === 'production' ? 'https' : 'http';
    const host = this.server.nodeEnv === 'production' ? 
      process.env.DOMAIN || 'your-api-domain.com' : 
      `${this.server.host}:${this.server.port}`;
    
    return `${protocol}://${host}`;
  },

  // Get API base URL
  getApiBaseUrl: function() {
    return `${this.getBaseUrl()}${this.api.prefix}`;
  },

  // Check if running in production
  isProduction: function() {
    return this.server.nodeEnv === 'production';
  },

  // Check if running in development
  isDevelopment: function() {
    return this.server.nodeEnv === 'development';
  }
};

module.exports = config;