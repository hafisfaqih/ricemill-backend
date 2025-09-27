const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database connection configuration
const sequelize = new Sequelize(
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

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    console.log(`🔗 Connected to: ${process.env.DB_NAME} at ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  } catch (error) {
    console.error('❌ Unable to connect to the database');
    console.error('💡 Make sure PostgreSQL is running and database exists');
    console.error('\n📋 Quick setup commands:');
    console.error('   brew install postgresql');
    console.error('   brew services start postgresql');
    console.error(`   createdb ${process.env.DB_NAME}`);
    console.error('\n🔧 Or update .env file with correct database credentials\n');
    
    if (process.env.NODE_ENV === 'development') {
      console.error('Error details:', error.message || error);
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