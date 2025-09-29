#!/usr/bin/env node
/**
 * Basic smoke test for critical CRUD flows (no auth yet)
 * Run: node scripts/smokeTest.js [--base http://localhost:3001]
 */
const axios = require('axios');

const base = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : 'http://localhost:3001';

const results = [];
function record(name, ok, extra) {
  results.push({ name, ok, extra });
  const status = ok ? 'PASS' : 'FAIL';
  console.log(`[${status}] ${name}${extra ? ' -> ' + extra : ''}`);
}

async function main() {
  try {
    // 1. Create supplier
    let supplierId;
    try {
      let r = await axios.post(`${base}/api/suppliers`, {
        name: 'PT Sumber Padi Smoke',
        contactPerson: 'Budi',
        phone: '+62811111111'
      });
      supplierId = r.data?.data?.id;
    } catch (e) {
      // If duplicate supplier name, create with unique suffix
      if (e.response?.data?.message && /already exists/i.test(e.response.data.message)) {
        const uniqueName = `PT Sumber Padi Smoke ${Date.now()}`;
        const r2 = await axios.post(`${base}/api/suppliers`, {
          name: uniqueName,
          contactPerson: 'Budi',
          phone: '+62811111111'
        });
        supplierId = r2.data?.data?.id;
      } else {
        throw e;
      }
    }
    record('Create Supplier', !!supplierId, `id=${supplierId}`);

    // 2. Create purchase (camelCase)
    r = await axios.post(`${base}/api/purchases`, {
      date: '2024-01-10',
      supplierId,
      quantity: 100,
      weight: 50,
      price: 200000,
      truckCost: 50000,
      laborCost: 20000
    });
    const purchaseId = r.data?.data?.id;
    const totalCost = r.data?.data?.totalCost;
    record('Create Purchase camelCase', !!purchaseId, `totalCost=${totalCost}`);

    // 3. Create purchase (legacy snake_case)
    r = await axios.post(`${base}/api/purchases`, {
      date: '2024-01-11',
      supplier_id: supplierId,
      quantity: 50,
      weight: 40,
      price: 190000,
      truck_cost: 40000,
      labor_cost: 15000
    });
    record('Create Purchase snake_case', !!r.data?.data?.id);

    // 4. Inventory endpoint
    r = await axios.get(`${base}/api/purchases/inventory`);
    record('Get Inventory', Array.isArray(r.data?.data));

    // 5. Valid sale
    r = await axios.post(`${base}/api/sales`, {
      date: '2024-01-16',
      purchaseId,
      quantity: 10,
      weight: 50,
      price: 2500000,
      pellet: 10000,
      fuel: 5000,
      labor: 8000
    });
    const saleId = r.data?.data?.id;
    const saleRevenue = r.data?.data?.revenue;
    record('Create Sale valid', !!saleId, `revenue=${saleRevenue}`);

    // 6. Oversell attempt (expect fail)
    let oversellOk = false;
    try {
      await axios.post(`${base}/api/sales`, {
        date: '2024-01-16',
        purchaseId,
        quantity: 200,
        weight: 50,
        price: 2500000
      });
    } catch (err) {
      oversellOk = (err.response?.status === 400 || err.response?.status === 500) && /Insufficient inventory/i.test(err.response?.data?.message || '');
    }
    record('Sale Oversell Rejected', oversellOk);

    // 7. Sale stats
    r = await axios.get(`${base}/api/sales/stats`);
    record('Sale Stats', !!r.data?.data);

    // 8. Profitability
  r = await axios.get(`${base}/api/sales/profitability`);
  const profOk = !!(r.data?.data?.summary?.totalRevenue || (r.data?.data?.trends && r.data.data.trends.length));
  record('Sale Profitability', profOk);

    // 9. Inventory turnover
    r = await axios.get(`${base}/api/sales/inventory-turnover`);
    record('Inventory Turnover', Array.isArray(r.data?.data));

    // 10. Create invoice (auto number)
    const baseItems = [
      { name: 'Beras Premium', quantity: 10, price: 300000 },
      { name: 'Karung Plastik', quantity: 10, price: 4000 }
    ];
    const baseAmount = baseItems.reduce((s,i)=> s + (i.quantity * i.price), 0);
    r = await axios.post(`${base}/api/invoices`, {
      date: '2024-01-20',
      customer: 'CV Grosir Beras',
      amount: baseAmount,
      dueDate: '2024-02-05',
      items: baseItems
    });
    const invoiceId = r.data?.data?.id;
    const invoiceNumber = r.data?.data?.invoiceNumber;
    record('Create Invoice auto number', !!invoiceId, invoiceNumber);

    // 11. Add invoice item
    r = await axios.post(`${base}/api/invoices/${invoiceId}/items`, {
      name: 'Biaya Kirim', quantity: 1, price: 150000
    });
    record('Add Invoice Item', !!r.data?.data?.id);

    // 12. Mark invoice as paid
    r = await axios.patch(`${base}/api/invoices/${invoiceId}/paid`);
    const paidStatus = r.data?.data?.status;
    record('Mark Invoice Paid', paidStatus === 'paid');

    // 13. Add item after paid (should fail)
    let postPaidFail = false;
    try {
      await axios.post(`${base}/api/invoices/${invoiceId}/items`, { name: 'After Paid', quantity: 1, price: 10000 });
    } catch (err) {
      postPaidFail = (err.response?.status === 400);
    }
    record('Reject Item After Paid', postPaidFail);

    // Summary
    const passed = results.filter(r => r.ok).length;
    const total = results.length;
    console.log('\n==== Smoke Test Summary ====');
    results.forEach(r => console.log(`${r.ok ? '✅' : '❌'} ${r.name}`));
    console.log(`Passed ${passed}/${total}`);
    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error('Fatal smoke test error:', err.response?.data || err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
