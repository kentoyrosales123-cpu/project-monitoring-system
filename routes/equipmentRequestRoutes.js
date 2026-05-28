const router = require("express").Router();
const { protect, adminOrInventory } = require("../middleware/authMiddleware");
const controller = require("../controllers/equipmentRequestController");

router.get("/", protect, controller.getRequests);

router.post("/", protect, controller.createRequest);

router.put(
  "/:id/approve",
  protect,
  adminOrInventory,
  controller.approveRequest,
);

router.put("/:id/reject", protect, adminOrInventory, controller.rejectRequest);

router.put(
  "/:id/out-for-delivery",
  protect,
  adminOrInventory,
  controller.markOutForDelivery,
);

router.put("/:id/received", protect, controller.confirmReceived);

router.put("/:id/request-return", protect, controller.requestReturn);

router.put(
  "/:id/confirm-returned",
  protect,
  adminOrInventory,
  controller.confirmReturned,
);

module.exports = router;
