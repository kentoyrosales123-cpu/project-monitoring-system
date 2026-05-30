const router = require("express").Router();
const { protect, adminOrInventory } = require("../middleware/authMiddleware");
const controller = require("../controllers/supplyRequestController");

router.get("/", protect, adminOrInventory, controller.getSupplyRequests);

router.post("/", protect, adminOrInventory, controller.createSupplyRequest);

router.put("/:id/approve", protect, controller.approveSupplyRequest);

router.put("/:id/reject", protect, controller.rejectSupplyRequest);

module.exports = router;
