const express = require('express');
const inventoryController = require('./inventory.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');

const router = express.Router();

router.get('/low-stock', authenticate, authorize('admin'), inventoryController.getLowStockAlerts);
router.get('/movements/:productId', authenticate, authorize('admin'), inventoryController.getStockMovements);
router.post('/adjust', authenticate, authorize('admin'), inventoryController.adjustStock);

module.exports = router;
