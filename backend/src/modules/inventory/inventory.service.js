const db = require('../../config/db');
const inventoryRepository = require('./inventory.repository');
const productRepository = require('../products/product.repository');
const ApiError = require('../../utils/ApiError');

class InventoryService {
  async getLowStockAlerts() {
    return inventoryRepository.getLowStockProducts();
  }

  async getStockMovements(productId) {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }
    return inventoryRepository.getStockMovementsByProduct(productId);
  }

  async adjustStock({ productId, movementType, quantityChange, performedBy, note }) {
    if (!note) {
      throw new ApiError(400, 'Note is required for manual stock adjustments');
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        'SELECT id, stock_quantity, name FROM products WHERE id = $1 FOR UPDATE',
        [productId]
      );

      if (rows.length === 0) {
        throw new ApiError(404, 'Product not found');
      }

      const product = rows[0];
      const newStock = product.stock_quantity + quantityChange;

      if (newStock < 0) {
        throw new ApiError(400, `Stock adjustment would result in negative stock for "${product.name}"`);
      }

      await client.query(
        'UPDATE products SET stock_quantity = $1, updated_at = now() WHERE id = $2',
        [newStock, productId]
      );

      const movement = await inventoryRepository.createStockMovement({
        productId,
        movementType,
        quantityChange,
        performedBy,
        note
      }, client);

      await client.query('COMMIT');
      return {
        productId,
        newStock,
        movement
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new InventoryService();
