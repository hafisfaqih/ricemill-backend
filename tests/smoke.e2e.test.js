const request = require('supertest');
const { app } = require('../server');
const { sequelize } = require('../config/db');

/** Helper asserts */
function expectOk(res, msg) {
  if (!res || !res.body) throw new Error(`No response for ${msg}`);
  expect(res.body.success).toBe(true);
}

describe('E2E Smoke Flow', () => {
  let supplierId; let purchaseId; let invoiceId; let invoiceNumber;

  beforeAll(async () => {
    // Ensure models are synced (simulate what startServer would do without binding a port)
    const { testConnection, syncDatabase } = require('../config/db');
    await testConnection();
    await syncDatabase();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('Full business flow', async () => {
    // 1 Supplier (unique name)
    const uniqueName = `PT Sumber Padi Smoke Test ${Date.now()}`;
    let res = await request(app).post('/api/suppliers').send({
      name: uniqueName,
      contactPerson: 'Budi',
      phone: '+62811111111'
    });
    expectOk(res, 'Create Supplier');
    supplierId = res.body.data.id;

    // 2 Purchase camelCase
    res = await request(app).post('/api/purchases').send({
      date: '2024-01-10',
      supplierId,
      quantity: 100,
      weight: 50,
      price: 200000,
      truckCost: 50000,
      laborCost: 20000
    });
    expectOk(res, 'Create Purchase camelCase');
    purchaseId = res.body.data.id;

    // 3 Purchase snake_case legacy
    res = await request(app).post('/api/purchases').send({
      date: '2024-01-11',
      supplier_id: supplierId,
      quantity: 50,
      weight: 40,
      price: 190000,
      truck_cost: 40000,
      labor_cost: 15000
    });
    expectOk(res, 'Create Purchase snake_case');

    // 4 Inventory
    res = await request(app).get('/api/purchases/inventory');
    expectOk(res, 'Get Inventory');

    // 5 Valid sale
    res = await request(app).post('/api/sales').send({
      date: '2024-01-16',
      purchaseId,
      quantity: 10,
      weight: 50,
      price: 2500000,
      pellet: 10000,
      fuel: 5000,
      labor: 8000
    });
    expectOk(res, 'Create Sale valid');

    // 6 Oversell attempt
    res = await request(app).post('/api/sales').send({
      date: '2024-01-16',
      purchaseId,
      quantity: 200,
      weight: 50,
      price: 2500000
    });
    expect(res.body.success).toBe(false);

    // 7 Sale stats
    res = await request(app).get('/api/sales/stats');
    expectOk(res, 'Sale Stats');

    // 8 Profitability
    res = await request(app).get('/api/sales/profitability');
    expect(res.body.success).toBe(true);
    expect(
      res.body.data.summary?.totalRevenue || (res.body.data.trends && res.body.data.trends.length >= 0)
    ).toBeTruthy();

    // 9 Inventory turnover
    res = await request(app).get('/api/sales/inventory-turnover');
    expectOk(res, 'Inventory Turnover');

    // 10 Create invoice
    const items = [
      { name: 'Beras Premium', quantity: 10, price: 300000 },
      { name: 'Karung Plastik', quantity: 10, price: 4000 }
    ];
    const amount = items.reduce((s,i)=> s + i.quantity * i.price, 0);
    res = await request(app).post('/api/invoices').send({
      date: '2024-01-20',
      customer: 'CV Grosir Beras',
      amount,
      dueDate: '2024-02-05',
      items
    });
    expectOk(res, 'Create Invoice');
    invoiceId = res.body.data.id; invoiceNumber = res.body.data.invoiceNumber;
    expect(invoiceNumber).toMatch(/^INV-\d{6}-\d{4}$/);

    // 11 Add invoice item
    res = await request(app).post(`/api/invoices/${invoiceId}/items`).send({
      name: 'Biaya Kirim', quantity: 1, price: 150000
    });
    expectOk(res, 'Add Invoice Item');

    // 12 Mark paid
    res = await request(app).patch(`/api/invoices/${invoiceId}/paid`).send();
    expectOk(res, 'Mark Invoice Paid');
    expect(res.body.data.status).toBe('paid');

    // 13 Reject add after paid
    res = await request(app).post(`/api/invoices/${invoiceId}/items`).send({ name: 'After Paid', quantity: 1, price: 10000 });
    expect(res.body.success).toBe(false);
  }, 60000);
});
