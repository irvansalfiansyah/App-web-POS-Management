const db = require('../../config/db');

class SalesRepository {
  async findAll() {
    const { rows } = await db.query(
      `SELECT id, order_number, cashier_id, subtotal, discount_total, tax_total, grand_total, payment_method, status, created_at
       FROM sales_orders ORDER BY created_at DESC`
    );
    return rows;
  }

  async findById(id) {
    const { rows: orderRows } = await db.query(
      `SELECT id, order_number, cashier_id, subtotal, discount_total, tax_total, grand_total, payment_method, status, created_at
       FROM sales_orders WHERE id = $1`,
      [id]
    );
    
    if (orderRows.length === 0) return null;

    const { rows: itemRows } = await db.query(
      `SELECT id, product_id, product_name, unit_price, quantity, line_total
       FROM order_items WHERE order_id = $1`,
      [id]
    );

    return {
      ...orderRows[0],
      items: itemRows
    };
  }

  async updateStatus(id, status, client = db) {
    const { rows } = await client.query(
      'UPDATE sales_orders SET status = $1 WHERE id = $2 RETURNING id, status',
      [status, id]
    );
    return rows[0] || null;
  }
}

module.exports = new SalesRepository();
