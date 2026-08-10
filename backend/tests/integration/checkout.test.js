const db = require('../../src/config/db');
const checkoutService = require('../../src/modules/sales/checkout.service');

describe('Checkout Concurrency (Race Condition) Tests', () => {
  let testProductId;
  let cashierId;

  beforeAll(async () => {
    const { rows: userRows } = await db.query(
      "SELECT id FROM users WHERE email = 'cashier1@store.com'"
    );
    if (userRows.length === 0) {
      throw new Error("Seeded cashier user not found. Please run seed script first.");
    }
    cashierId = userRows[0].id;
  });

  beforeEach(async () => {
    await db.query('DELETE FROM stock_movements');
    await db.query('DELETE FROM order_items');
    await db.query('DELETE FROM sales_orders');

    const uniqueSku = `TEST-SKU-${Date.now()}`;
    const { rows: prodRows } = await db.query(
      `INSERT INTO products (sku, name, sell_price, stock_quantity, low_stock_threshold)
       VALUES ($1, 'Test Concurrency Product', 10.00, 5, 2)
       RETURNING id`,
      [uniqueSku]
    );
    testProductId = prodRows[0].id;
  });

  afterAll(async () => {
    await db.query('DELETE FROM stock_movements');
    await db.query('DELETE FROM order_items');
    await db.query('DELETE FROM sales_orders');
    await db.query("DELETE FROM products WHERE sku LIKE 'TEST-SKU-%'");
    await db.end();
  });

  test('should successfully complete exactly 5 orders and fail 5 under high concurrency', async () => {
    const concurrentRequests = 10;
    const promises = [];

    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        checkoutService.processCheckout({
          cashierId,
          cartItems: [{ productId: testProductId, quantity: 1 }],
          paymentMethod: 'cash'
        })
      );
    }

    const results = await Promise.allSettled(promises);

    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    console.log(`Concurreny results - Succeeded: ${fulfilled.length}, Failed: ${rejected.length}`);

    expect(fulfilled.length).toBe(5);
    expect(rejected.length).toBe(5);

    rejected.forEach(r => {
      expect(r.reason.statusCode).toBe(409);
      expect(r.reason.message).toContain('Insufficient stock');
    });

    const { rows: prodRows } = await db.query(
      'SELECT stock_quantity FROM products WHERE id = $1',
      [testProductId]
    );
    expect(prodRows[0].stock_quantity).toBe(0);

    const { rows: movementRows } = await db.query(
      'SELECT id FROM stock_movements WHERE product_id = $1',
      [testProductId]
    );
    expect(movementRows.length).toBe(5);
  });
});
