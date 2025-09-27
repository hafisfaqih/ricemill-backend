/**
 * Rice Mill Management API - Test Script for Frontend Team
 * 
 * This script demonstrates how to call all API endpoints
 * Run with: node test-api.js
 */

const axios = require('axios');

// Base URL for the API
const BASE_URL = 'http://localhost:3001';

// Configure axios defaults
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper function for logging responses
const logResponse = (operation, response) => {
  console.log(`\n🔹 ${operation}:`);
  console.log(`Status: ${response.status}`);
  console.log('Data:', JSON.stringify(response.data, null, 2));
};

// Helper function for error handling
const handleError = (operation, error) => {
  console.log(`\n❌ ${operation} failed:`);
  if (error.response) {
    console.log(`Status: ${error.response.status}`);
    console.log('Error:', error.response.data);
  } else {
    console.log('Error:', error.message);
  }
};

// Test data
const testSupplier = {
  name: 'PT. Beras Test Sejahtera',
  contact_person: 'Test Contact',
  phone: '+6281234567890',
  address: 'Jl. Test No. 123, Jakarta',
  status: 'active'
};

const testPurchase = {
  date: '2024-01-15',
  supplier_id: 1,
  supplier: 'PT. Beras Test Sejahtera',
  quantity: 100,
  weight: 5000.50,
  price: 25000000.00,
  truck_cost: 500000.00,
  labor_cost: 300000.00
};

const testSale = {
  date: '2024-01-20',
  purchase_id: 1,
  quantity: 50,
  weight: 2500.25,
  price: 15000000.00,
  pellet: 200000.00,
  fuel: 150000.00,
  labor: 100000.00
};

const testInvoice = {
  invoice_number: 'INV-TEST-001',
  customer_name: 'Test Customer',
  customer_address: 'Test Address',
  date: '2024-01-25',
  due_date: '2024-02-25',
  status: 'unpaid'
};

const testInvoiceItem = {
  description: 'Test Rice Premium',
  quantity: 25,
  price: 12000,
  unit: 'kg'
};

async function runAPITests() {
  console.log('🌾 Rice Mill Management API - Testing All Endpoints');
  console.log('================================================\n');

  try {
    // 1. Health Check
    console.log('1️⃣ SYSTEM HEALTH CHECK');
    const health = await api.get('/health');
    logResponse('Health Check', health);

    // 2. Supplier Tests
    console.log('\n2️⃣ SUPPLIER MANAGEMENT TESTS');
    
    // Create supplier
    const supplierResponse = await api.post('/api/suppliers', testSupplier);
    logResponse('Create Supplier', supplierResponse);
    const supplierId = supplierResponse.data.data.id;

    // Get all suppliers
    const suppliers = await api.get('/api/suppliers');
    logResponse('Get All Suppliers', suppliers);

    // Get supplier by ID
    const supplier = await api.get(`/api/suppliers/${supplierId}`);
    logResponse('Get Supplier by ID', supplier);

    // Get supplier statistics
    const supplierStats = await api.get('/api/suppliers/stats');
    logResponse('Supplier Statistics', supplierStats);

    // Search suppliers
    const supplierSearch = await api.get('/api/suppliers/search?q=Test');
    logResponse('Search Suppliers', supplierSearch);

    // 3. Purchase Tests
    console.log('\n3️⃣ PURCHASE MANAGEMENT TESTS');
    
    // Update test purchase with actual supplier ID
    testPurchase.supplier_id = supplierId;
    
    // Create purchase
    const purchaseResponse = await api.post('/api/purchases', testPurchase);
    logResponse('Create Purchase', purchaseResponse);
    const purchaseId = purchaseResponse.data.data.id;

    // Get all purchases
    const purchases = await api.get('/api/purchases');
    logResponse('Get All Purchases', purchases);

    // Get purchase statistics
    const purchaseStats = await api.get('/api/purchases/stats');
    logResponse('Purchase Statistics', purchaseStats);

    // Get available inventory
    const inventory = await api.get('/api/purchases/inventory');
    logResponse('Available Inventory', inventory);

    // Get monthly trends
    const trends = await api.get('/api/purchases/trends');
    logResponse('Monthly Trends', trends);

    // 4. Sale Tests
    console.log('\n4️⃣ SALES MANAGEMENT TESTS');
    
    // Update test sale with actual purchase ID
    testSale.purchase_id = purchaseId;
    
    // Create sale
    const saleResponse = await api.post('/api/sales', testSale);
    logResponse('Create Sale', saleResponse);
    const saleId = saleResponse.data.data.id;

    // Get all sales
    const sales = await api.get('/api/sales');
    logResponse('Get All Sales', sales);

    // Get sales statistics
    const salesStats = await api.get('/api/sales/stats');
    logResponse('Sales Statistics', salesStats);

    // Get profitability analysis
    const profitability = await api.get('/api/sales/profitability');
    logResponse('Profitability Analysis', profitability);

    // 5. Invoice Tests
    console.log('\n5️⃣ INVOICE MANAGEMENT TESTS');
    
    // Create invoice
    const invoiceResponse = await api.post('/api/invoices', testInvoice);
    logResponse('Create Invoice', invoiceResponse);
    const invoiceId = invoiceResponse.data.data.id;

    // Add invoice item
    const invoiceItemResponse = await api.post(`/api/invoices/${invoiceId}/items`, testInvoiceItem);
    logResponse('Add Invoice Item', invoiceItemResponse);

    // Get all invoices
    const invoices = await api.get('/api/invoices');
    logResponse('Get All Invoices', invoices);

    // Get invoice statistics
    const invoiceStats = await api.get('/api/invoices/stats');
    logResponse('Invoice Statistics', invoiceStats);

    // Get aging report
    const agingReport = await api.get('/api/invoices/aging-report');
    logResponse('Aging Report', agingReport);

    // Mark invoice as paid
    const paidInvoice = await api.patch(`/api/invoices/${invoiceId}/paid`);
    logResponse('Mark Invoice as Paid', paidInvoice);

    console.log('\n✅ ALL API TESTS COMPLETED SUCCESSFULLY!');
    console.log('\n📋 SUMMARY:');
    console.log('- All endpoints are working without authentication');
    console.log('- Swagger documentation available at: http://localhost:3001/api-docs');
    console.log('- Frontend team can start integration immediately');
    console.log('- Test data has been created in the database for reference');

  } catch (error) {
    handleError('API Test', error);
  }
}

// Additional test functions for specific scenarios
async function testPagination() {
  console.log('\n📄 TESTING PAGINATION');
  try {
    const response = await api.get('/api/suppliers?page=1&limit=5');
    logResponse('Pagination Test', response);
  } catch (error) {
    handleError('Pagination Test', error);
  }
}

async function testSearchAndFilter() {
  console.log('\n🔍 TESTING SEARCH & FILTERING');
  try {
    // Search suppliers
    const supplierSearch = await api.get('/api/suppliers/search?q=Test');
    logResponse('Supplier Search', supplierSearch);

    // Search purchases with date range
    const purchaseSearch = await api.get('/api/purchases/search?startDate=2024-01-01&endDate=2024-12-31');
    logResponse('Purchase Search with Date Range', purchaseSearch);

  } catch (error) {
    handleError('Search Test', error);
  }
}

// Run the tests
async function main() {
  console.log('Starting API tests...\n');
  
  await runAPITests();
  await testPagination();
  await testSearchAndFilter();
  
  console.log('\n🎉 Frontend API testing complete!');
  console.log('You can now start building your frontend application.');
}

// Export for module use or run directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  runAPITests,
  testPagination,
  testSearchAndFilter,
  BASE_URL
};