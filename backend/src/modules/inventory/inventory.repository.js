const db = require('../../config/db');

class InventoryRepository {
  async getLowStockProducts() {
    const { rows } = await db.query(
      `SELECT id, sku, name, stock_quantity, low_stock_threshold, is_active
       FROM products
       WHERE stock_quantity <= low_stock_threshold AND is_active = true
       ORDER BY stock_quantity ASC`
    );
    return rows;
  }

  async getStockMovementsByProduct(productId) {
    const { rows } = await db.query(
      `SELECT sm.id, sm.product_id, sm.movement_type, sm.quantity_change, sm.reference_order_id, sm.performed_by, u.full_name as performed_by_name, sm.note, sm.created_at
       FROM stock_movements sm
       LEFT JOIN users u ON sm.performed_by = u.id
       WHERE sm.product_id = $1
       ORDER BY sm.created_at DESC`,
      [productId]
    );
    return rows;
  }

  async createStockMovement({ productId, movementType, quantityChange, referenceOrderId, performedBy, note }, client = db) {
    const { rows } = await client.query(
      `INSERT INTO stock_movements (product_id, movement_type, quantity_change, reference_order_id, performed_by, note)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, product_id, movement_type, quantity_change, reference_order_id, performed_by, note, created_at`,
      [productId, movementType, quantityChange, referenceOrderId || null, performedBy, note]
    );
    return rows[0];
  }
}

module.exports = new InventoryRepository();
