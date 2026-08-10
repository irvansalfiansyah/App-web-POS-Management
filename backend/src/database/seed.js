const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function runSeed() {
  const client = await db.connect();
  try {
    console.log('Seeding database with premium reference items and transaction history...');
    await client.query('BEGIN');

    // Clean existing tables to prevent duplicate key violations and ensure clean state
    await client.query('DELETE FROM stock_movements');
    await client.query('DELETE FROM order_items');
    await client.query('DELETE FROM sales_orders');
    await client.query('DELETE FROM products');
    await client.query('DELETE FROM categories');
    await client.query('DELETE FROM users');

    console.log('Inserting categories...');
    const { rows: categories } = await client.query(`
      INSERT INTO categories (name) VALUES 
      ('Food'), ('Beverages'), ('Apparel'), ('Electronics'), ('Home')
      RETURNING id, name
    `);
    const catMap = categories.reduce((acc, cat) => {
      acc[cat.name] = cat.id;
      return acc;
    }, {});

    console.log('Inserting users...');
    const adminHash = await bcrypt.hash('admin123', 10);
    const cashierHash = await bcrypt.hash('cashier123', 10);
    
    const { rows: users } = await client.query(`
      INSERT INTO users (full_name, email, password_hash, role) VALUES 
      ('Admin Store', 'admin@store.com', $1, 'admin'),
      ('Cashier 1', 'cashier1@store.com', $2, 'cashier')
      RETURNING id, role
    `, [adminHash, cashierHash]);

    const adminUser = users.find(u => u.role === 'admin');
    const cashierUser = users.find(u => u.role === 'cashier');

    console.log('Inserting products matching design screenshot...');
    const productsData = [
      ['SKU-001', '123456789012', 'Organic Coffee', catMap['Beverages'], 6.00, 12.00, 45, 10],
      ['SKU-002', '123456789013', 'Green Tea', catMap['Beverages'], 4.00, 8.50, 3, 5],
      ['SKU-003', '123456789014', 'Denim Jacket', catMap['Apparel'], 25.00, 55.00, 12, 5],
      ['SKU-004', '123456789015', 'Cotton T-Shirt', catMap['Apparel'], 7.00, 15.00, 22, 5],
      ['SKU-005', '123456789016', 'Breakfast Burrito', catMap['Food'], 3.00, 6.50, 10, 2],
      ['SKU-006', '123456789017', 'Espresso', catMap['Beverages'], 6.00, 14.00, 4, 5],
      ['SKU-007', '123456789018', 'Silk Scarf', catMap['Apparel'], 12.00, 25.00, 9, 3],
      ['SKU-008', '123456789019', 'Water Bottle', catMap['Home'], 2.00, 5.00, 50, 10],
    ];

    const prodMap = {};
    for (const prod of productsData) {
      const { rows } = await client.query(`
        INSERT INTO products (sku, barcode, name, category_id, cost_price, sell_price, stock_quantity, low_stock_threshold)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, name, sell_price
      `, prod);
      prodMap[prod[0]] = rows[0]; // Map SKU to DB product info
    }

    console.log('Inserting sample transaction history...');
    
    // Helper to format past date offsets dynamically
    const getDateOffset = (days) => {
      const d = new Date();
      d.setDate(d.getDate() - days);
      return d.toISOString();
    };

    const orders = [
      {
        order_number: 'INV-20260806-001',
        cashier_id: cashierUser.id,
        subtotal: 79.00,
        discount_total: 0.00,
        tax_total: 7.90,
        grand_total: 86.90,
        payment_method: 'cash',
        status: 'completed',
        created_at: getDateOffset(2),
        items: [
          { sku: 'SKU-001', qty: 2, price: 12.00 },
          { sku: 'SKU-003', qty: 1, price: 55.00 }
        ]
      },
      {
        order_number: 'INV-20260807-001',
        cashier_id: cashierUser.id,
        subtotal: 34.50,
        discount_total: 0.00,
        tax_total: 3.45,
        grand_total: 37.95,
        payment_method: 'qris',
        status: 'completed',
        created_at: getDateOffset(1),
        items: [
          { sku: 'SKU-005', qty: 1, price: 6.50 },
          { sku: 'SKU-006', qty: 2, price: 14.00 }
        ]
      },
      {
        order_number: 'INV-20260808-001',
        cashier_id: adminUser.id,
        subtotal: 20.00,
        discount_total: 0.00,
        tax_total: 2.00,
        grand_total: 22.00,
        payment_method: 'card',
        status: 'completed',
        created_at: getDateOffset(0),
        items: [
          { sku: 'SKU-004', qty: 1, price: 15.00 },
          { sku: 'SKU-008', qty: 1, price: 5.00 }
        ]
      },
      {
        order_number: 'INV-20260805-001',
        cashier_id: cashierUser.id,
        subtotal: 25.00,
        discount_total: 0.00,
        tax_total: 2.50,
        grand_total: 27.50,
        payment_method: 'cash',
        status: 'refunded',
        created_at: getDateOffset(3),
        items: [
          { sku: 'SKU-007', qty: 1, price: 25.00 }
        ]
      }
    ];

    for (const o of orders) {
      const { rows: orderRows } = await client.query(`
        INSERT INTO sales_orders (order_number, cashier_id, subtotal, discount_total, tax_total, grand_total, payment_method, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [o.order_number, o.cashier_id, o.subtotal, o.discount_total, o.tax_total, o.grand_total, o.payment_method, o.status, o.created_at]);
      
      const orderId = orderRows[0].id;
      
      for (const item of o.items) {
        const dbProd = prodMap[item.sku];
        await client.query(`
          INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [orderId, dbProd.id, dbProd.name, item.price, item.qty, item.price * item.qty]);
      }
    }

    await client.query('COMMIT');
    console.log('✅ Database seeded successfully with premium items and transactions history.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to seed database:', error);
  } finally {
    client.release();
    db.end();
  }
}

runSeed();
