const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const c = require("../controllers/manpowerRequestController");

router.get("/", protect, c.getRequests);
router.post("/", protect, c.createRequest);

// Put specific route FIRST
router.put("/:id/mark-assigned", protect, c.markAssigned);
router.put("/:id/unassign", protect, c.unassignWorkers);

// Put dynamic route AFTER
router.put("/:id/:action", protect, c.reviewRequest);

module.exports = router;
