const checkoutService = require('./checkout.service');
const salesRepository = require('./sales.repository');
const asyncHandler = require('../../utils/asyncHandler');

class SalesController {
  checkout = asyncHandler(async (req, res) => {
    const { cartItems, paymentMethod } = req.body;
    const cashierId = req.user.id;
    const order = await checkoutService.processCheckout({ cashierId, cartItems, paymentMethod });
    res.status(201).json({ error: false, order });
  });

  refund = asyncHandler(async (req, res) => {
    const orderId = Number(req.params.id);
    const adminId = req.user.id;
    const result = await checkoutService.processRefund(orderId, adminId);
    res.status(200).json({ error: false, ...result });
  });

  getSalesOrders = asyncHandler(async (req, res) => {
    const orders = await salesRepository.findAll();
    res.status(200).json({ error: false, orders });
  });

  getSalesOrderById = asyncHandler(async (req, res) => {
    const order = await salesRepository.findById(req.params.id);
    if (!order) {
      res.status(404).json({ error: true, message: 'Order not found' });
      return;
    }
    res.status(200).json({ error: false, order });
  });
}

module.exports = new SalesController();
