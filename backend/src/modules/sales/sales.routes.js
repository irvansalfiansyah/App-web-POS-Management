const express = require('express');
const salesController = require('./sales.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validateRequest = require('../../middlewares/validateRequest');
const { checkoutSchema } = require('./sales.validation');

const router = express.Router();

router.post('/checkout', authenticate, validateRequest(checkoutSchema), salesController.checkout);

router.post('/:id/refund', authenticate, authorize('admin'), salesController.refund);
router.get('/', authenticate, authorize('admin'), salesController.getSalesOrders);
router.get('/:id', authenticate, authorize('admin'), salesController.getSalesOrderById);

module.exports = router;
