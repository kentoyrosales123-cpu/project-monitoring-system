const router = require("express").Router();
const upload = require("../middleware/uploadMiddleware");
const { protect } = require("../middleware/authMiddleware");
const c = require("../controllers/dailyReportController");

router.get("/", protect, c.getReports);

router.post("/", protect, upload.array("photos", 10), c.createReport);

router.put("/:id", protect, upload.array("photos", 10), c.updateReport);

router.put("/:id/confirm", protect, c.confirmReport);

router.put("/:id/needs-revision", protect, c.needsRevisionReport);

router.delete("/:id", protect, c.deleteReport);

module.exports = router;
