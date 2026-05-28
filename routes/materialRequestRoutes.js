const router = require("express").Router();
const { protect, adminOrInventory } = require("../middleware/authMiddleware");
const c = require("../controllers/materialRequestController");

router.get("/", protect, c.getRequests);
router.post("/", protect, c.createRequest);

router.put("/:id/approve", protect, adminOrInventory, c.approveRequest);
router.put("/:id/reject", protect, adminOrInventory, c.rejectRequest);

router.put(
  "/:id/out-for-delivery",
  protect,
  adminOrInventory,
  c.markOutForDelivery,
);
router.put("/:id/received", protect, c.confirmReceived);

module.exports = router;
