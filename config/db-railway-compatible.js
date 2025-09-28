const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database connection configuration with Railway support
let sequelize;

if (process.env.DATABASE_URL) {
  // Railway/Cloud deployment - use DATABASE_URL
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  });
} else {
  // Local/VPS deployment - use individual variables
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USERNAME,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      define: {
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    }
  );
}

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    
    // Show connection info based on environment
    if (process.env.DATABASE_URL) {
      console.log('🔗 Connected via DATABASE_URL (Railway/Cloud mode)');
      const config = sequelize.config;
      console.log(`🔗 Connected to: ${config.database} at ${config.host}:${config.port}`);
    } else {
      console.log(`🔗 Connected to: ${process.env.DB_NAME} at ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    }
  } catch (error) {
    console.error('❌ Unable to connect to the database');
    console.error('💡 Make sure PostgreSQL is running and database exists');
    
    if (process.env.DATABASE_URL) {
      console.error('\n📋 Railway/Cloud deployment troubleshooting:');
      console.error('   - Check DATABASE_URL format');
      console.error('   - Verify PostgreSQL service is running');
      console.error('   - Check service references: ${{Postgres.DATABASE_PUBLIC_URL}}');
    } else {
      console.error('\n📋 Local/VPS deployment troubleshooting:');
      console.error('   - brew install postgresql (macOS)');
      console.error('   - brew services start postgresql');
      console.error(`   - createdb ${process.env.DB_NAME || 'your_database'}`);
      console.error('\n🔧 Or update .env file with correct database credentials');
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.error('\nError details:', error.message || error);
    }
    
    // Don't exit immediately in development to allow for manual database setup
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw error;
  }
};

// Sync database models
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error.message);
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
};