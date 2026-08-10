const db = require('../../config/db');

class ProductRepository {
  async findAll({ is_active } = {}) {
    let query = `
      SELECT p.id, p.sku, p.barcode, p.name, p.category_id, c.name as category_name, 
             p.cost_price, p.sell_price, p.stock_quantity, p.low_stock_threshold, 
             p.image_url, p.is_active 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `;
    const params = [];
    if (is_active !== undefined) {
      query += ' WHERE p.is_active = $1';
      params.push(is_active);
    }
    query += ' ORDER BY p.id ASC';
    const { rows } = await db.query(query, params);
    return rows;
  }

  async findById(id) {
    const { rows } = await db.query(
      `SELECT p.id, p.sku, p.barcode, p.name, p.category_id, c.name as category_name, 
              p.cost_price, p.sell_price, p.stock_quantity, p.low_stock_threshold, 
              p.image_url, p.is_active 
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  async findByBarcode(barcode) {
    const { rows } = await db.query(
      `SELECT p.id, p.sku, p.barcode, p.name, p.category_id, c.name as category_name, 
              p.cost_price, p.sell_price, p.stock_quantity, p.low_stock_threshold, 
              p.image_url, p.is_active 
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.barcode = $1 AND p.is_active = true`,
      [barcode]
    );
    return rows[0] || null;
  }

  async create({ sku, barcode, name, categoryId, costPrice, sellPrice, stockQuantity, lowStockThreshold, imageUrl }) {
    const { rows } = await db.query(
      `INSERT INTO products (sku, barcode, name, category_id, cost_price, sell_price, stock_quantity, low_stock_threshold, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, sku, barcode, name, category_id, cost_price, sell_price, stock_quantity, low_stock_threshold, image_url, is_active`,
      [sku, barcode || null, name, categoryId || null, costPrice, sellPrice, stockQuantity, lowStockThreshold, imageUrl || null]
    );
    return rows[0];
  }

  async update(id, { sku, barcode, name, categoryId, costPrice, sellPrice, stockQuantity, lowStockThreshold, imageUrl, isActive }) {
    const { rows } = await db.query(
      `UPDATE products
       SET sku = $1, barcode = $2, name = $3, category_id = $4, cost_price = $5, sell_price = $6, stock_quantity = $7, low_stock_threshold = $8, image_url = $9, is_active = $10, updated_at = now()
       WHERE id = $11
       RETURNING id, sku, barcode, name, category_id, cost_price, sell_price, stock_quantity, low_stock_threshold, image_url, is_active`,
      [sku, barcode || null, name, categoryId || null, costPrice, sellPrice, stockQuantity, lowStockThreshold, imageUrl || null, isActive, id]
    );
    return rows[0] || null;
  }

  async softDelete(id) {
    const { rows } = await db.query(
      'UPDATE products SET is_active = false, updated_at = now() WHERE id = $1 RETURNING id',
      [id]
    );
    return rows[0] || null;
  }
}

module.exports = new ProductRepository();
