#!/usr/bin/env node

require('dotenv').config();
const readline = require('readline');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Register all models so Sequelize knows about every table before syncing
require('../app/models/supplier');
require('../app/models/purchase');
require('../app/models/sale');
require('../app/models/invoice');
require('../app/models/invoiceItem');
require('../app/models/user');

const confirmReset = () => {
  if (process.argv.includes('--force')) {
    return Promise.resolve(true);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question('⚠️  This will DROP and recreate every table. Continue? (yes/no) ', answer => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'yes');
    });
  });
};

const dropTables = async () => {
  const tables = await sequelize.query(
    `SELECT tablename
     FROM pg_tables
     WHERE schemaname = 'public';`,
    { type: QueryTypes.SELECT }
  );

  if (!tables.length) {
    console.log('ℹ️  No tables detected in public schema. Skipping table drop.');
    return;
  }

  for (const { tablename } of tables) {
    await sequelize.query(`DROP TABLE IF EXISTS "${tablename}" CASCADE;`);
  }

  console.log(`🗑️  Dropped ${tables.length} table(s).`);
};

const dropEnumTypes = async () => {
  const enumRows = await sequelize.query(
    `SELECT DISTINCT t.typname AS enum_name
     FROM pg_type t
     JOIN pg_enum e ON t.oid = e.enumtypid
     JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
     WHERE n.nspname = 'public' AND t.typname LIKE 'enum_%';`,
    { type: QueryTypes.SELECT }
  );

  if (!enumRows.length) {
    console.log('ℹ️  No enum types detected.');
    return;
  }

  for (const { enum_name: enumName } of enumRows) {
    await sequelize.query(`DROP TYPE IF EXISTS "${enumName}" CASCADE;`);
  }

  console.log(`🧹 Dropped ${enumRows.length} enum type(s).`);
};

(async () => {
  try {
    const confirmed = await confirmReset();
    if (!confirmed) {
      console.log('🚫 Aborted. Database remains unchanged.');
      process.exit(0);
    }

    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connection established.');

  console.log('🧨 Dropping all tables...');
  await dropTables();

  console.log('🧼 Cleaning up enum types...');
  await dropEnumTypes();

    console.log('🏗️  Recreating schema...');
    await sequelize.sync({ force: true });
    console.log('🌱 Fresh schema created successfully.');

    console.log('✨ Database is now empty and ready for new data.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to reset database:', error.message || error);
    process.exit(1);
  }
})();
