const inventoryService = require('./inventory.service');
const asyncHandler = require('../../utils/asyncHandler');

class InventoryController {
  getLowStockAlerts = asyncHandler(async (req, res) => {
    const alerts = await inventoryService.getLowStockAlerts();
    res.status(200).json({ error: false, alerts });
  });

  getStockMovements = asyncHandler(async (req, res) => {
    const productId = Number(req.params.productId);
    const movements = await inventoryService.getStockMovements(productId);
    res.status(200).json({ error: false, movements });
  });

  adjustStock = asyncHandler(async (req, res) => {
    const { productId, movementType, quantityChange, note } = req.body;
    const performedBy = req.user.id;
    
    const result = await inventoryService.adjustStock({
      productId: Number(productId),
      movementType,
      quantityChange: Number(quantityChange),
      performedBy,
      note
    });

    res.status(200).json({ error: false, ...result });
  });
}

module.exports = new InventoryController();
