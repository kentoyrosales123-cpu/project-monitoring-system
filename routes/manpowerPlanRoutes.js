const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const c = require("../controllers/manpowerPlanController");

router.get("/", protect, c.getPlans);
router.post("/", protect, c.createPlan);
router.delete("/:id", protect, c.deletePlan);
router.get("/comparison/summary", protect, c.comparison);

module.exports = router;
