const router = require("express").Router();
const { protect, adminOrInventory } = require("../middleware/authMiddleware");
const materialController = require("../controllers/materialController");

router.get("/", protect, materialController.getMaterials);

router.post("/", protect, adminOrInventory, materialController.createMaterial);

router.get(
  "/warehouse/request-options",
  protect,
  materialController.getWarehouseMaterialsForRequest,
);

router.delete(
  "/:id",
  protect,
  adminOrInventory,
  materialController.deleteMaterial,
);
router.put(
  "/:id/inventory-on-hand",
  protect,
  materialController.updateInventoryOnHand,
);

router.put("/:id/used", protect, materialController.updateUsedQuantity);

module.exports = router;
