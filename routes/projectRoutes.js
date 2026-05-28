const router = require("express").Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const c = require("../controllers/projectController");

router.get("/dashboard-stats", protect, c.dashboardStats);
router.get("/my-projects", protect, c.getMyProjects);

router.get("/", protect, c.getProjects);
router.post("/", protect, adminOnly, c.createProject);
router.put("/:id/progress", protect, c.updateProgress);
router.put("/:id", protect, adminOnly, c.updateProject);
router.delete("/:id", protect, adminOnly, c.deleteProject);

module.exports = router;
