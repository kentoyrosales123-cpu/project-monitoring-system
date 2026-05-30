const router = require("express").Router();
const { protect, adminOrInventory } = require("../middleware/authMiddleware");
const materialController = require("../controllers/materialController");
const Material = require("../models/Material");

router.get("/", protect, materialController.getMaterials);

router.post("/", protect, adminOrInventory, materialController.createMaterial);

router.get(
  "/warehouse/request-options",
  protect,
  materialController.getWarehouseMaterialsForRequest,
);

router.put("/:id", protect, adminOrInventory, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    material.materialName = req.body.materialName ?? material.materialName;
    material.category = req.body.category ?? material.category;
    material.unit = req.body.unit ?? material.unit;
    if (req.body.quantityDelivered !== undefined) {
      const newDelivered = Number(req.body.quantityDelivered || 0);

      // preserve already released quantity
      const alreadyUsed = Number(material.quantityUsed || 0);

      material.quantityDelivered = newDelivered;

      material.inventoryOnHand = newDelivered - alreadyUsed;
    }
    material.reorderLevel = req.body.reorderLevel ?? material.reorderLevel;
    material.unitCost = req.body.unitCost ?? material.unitCost;
    material.deliveryDate = req.body.deliveryDate ?? material.deliveryDate;

    const updated = await material.save();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put(
  "/:id/inventory-on-hand",
  protect,
  materialController.updateInventoryOnHand,
);

router.put("/:id/used", protect, materialController.updateUsedQuantity);

router.put("/:id/add-stock", protect, adminOrInventory, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    const addQty = Number(req.body.addQty || 0);

    if (addQty <= 0) {
      return res
        .status(400)
        .json({ message: "Add quantity must be greater than zero." });
    }

    material.quantityDelivered =
      Number(material.quantityDelivered || 0) + addQty;

    material.inventoryOnHand =
      Number(material.quantityDelivered || 0) -
      Number(material.quantityUsed || 0);

    material.lastUpdatedBy = req.user._id;
    material.lastUpdatedAt = new Date();

    const updated = await material.save();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete(
  "/:id",
  protect,
  adminOrInventory,
  materialController.deleteMaterial,
);

module.exports = router;
