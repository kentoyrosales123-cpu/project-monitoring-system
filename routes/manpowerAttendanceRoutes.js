const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const c = require("../controllers/manpowerAttendanceController");

router.get("/", protect, c.getAttendance);
router.post("/", protect, c.createAttendance);
router.delete("/:id", protect, c.deleteAttendance);
router.get("/analytics/summary", protect, c.analytics);

module.exports = router;
