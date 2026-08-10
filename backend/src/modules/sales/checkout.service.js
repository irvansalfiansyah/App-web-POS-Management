const db = require('../../config/db');
const generateOrderNumber = require('../../utils/generateOrderNumber');
const ApiError = require('../../utils/ApiError');
const salesRepository = require('./sales.repository');

class CheckoutService {
  async processCheckout({ cashierId, cartItems, paymentMethod }) {
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      let subtotal = 0;
      const orderItemRows = [];

      const sortedItems = [...cartItems].sort((a, b) => a.productId - b.productId);

      for (const item of sortedItems) {
        const { rows } = await client.query(
          `SELECT id, name, sell_price, stock_quantity, is_active
           FROM products
           WHERE id = $1
           FOR UPDATE`,
          [item.productId]
        );

        if (rows.length === 0) {
          throw new ApiError(404, `Product with ID ${item.productId} not found`);
        }

        const product = rows[0];

        if (!product.is_active) {
          throw new ApiError(400, `Product "${product.name}" is no longer active`);
        }

        if (product.stock_quantity < item.quantity) {
          throw new ApiError(
            409,
            `Insufficient stock for "${product.name}" (have ${product.stock_quantity}, need ${item.quantity})`
          );
        }

        const lineTotal = Number(product.sell_price) * item.quantity;
        subtotal += lineTotal;

        orderItemRows.push({
          productId: product.id,
          name: product.name,
          unitPrice: product.sell_price,
          quantity: item.quantity,
          lineTotal
        });

        await client.query(
          `UPDATE products
           SET stock_quantity = stock_quantity - $1, updated_at = now()
           WHERE id = $2`,
          [item.quantity, product.id]
        );
      }

      const taxRate = 0.1;
      const taxTotal = subtotal * taxRate;
      const grandTotal = subtotal + taxTotal;
      const orderNumber = generateOrderNumber();

      const { rows: orderRows } = await client.query(
        `INSERT INTO sales_orders (order_number, cashier_id, subtotal, tax_total, grand_total, payment_method, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'completed')
         RETURNING id, order_number, cashier_id, subtotal, tax_total, grand_total, payment_method, status, created_at`,
        [orderNumber, cashierId, subtotal, taxTotal, grandTotal, paymentMethod]
      );
      const order = orderRows[0];

      for (const item of orderItemRows) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [order.id, item.productId, item.name, item.unitPrice, item.quantity, item.lineTotal]
        );

        await client.query(
          `INSERT INTO stock_movements (product_id, movement_type, quantity_change, reference_order_id, performed_by, note)
           VALUES ($1, 'sale', $2, $3, $4, 'POS checkout')`,
          [item.productId, -item.quantity, order.id, cashierId]
        );
      }

      await client.query('COMMIT');

      return {
        ...order,
        items: orderItemRows
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async processRefund(orderId, adminId) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const order = await salesRepository.findById(orderId);
      if (!order) {
        throw new ApiError(404, 'Order not found');
      }

      if (order.status === 'refunded') {
        throw new ApiError(400, 'Order is already refunded');
      }

      await salesRepository.updateStatus(orderId, 'refunded', client);

      for (const item of order.items) {
        await client.query(
          'SELECT id FROM products WHERE id = $1 FOR UPDATE',
          [item.product_id]
        );

        await client.query(
          `UPDATE products
           SET stock_quantity = stock_quantity + $1, updated_at = now()
           WHERE id = $2`,
          [item.quantity, item.product_id]
        );

        await client.query(
          `INSERT INTO stock_movements (product_id, movement_type, quantity_change, reference_order_id, performed_by, note)
           VALUES ($1, 'refund', $2, $3, $4, 'POS refund')`,
          [item.product_id, item.quantity, orderId, adminId]
        );
      }

      await client.query('COMMIT');
      return { id: orderId, status: 'refunded' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new CheckoutService();
