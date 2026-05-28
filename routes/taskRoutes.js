const router = require("express").Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const c = require("../controllers/taskController");

router.get("/", protect, c.getTasks);
router.post("/", protect, adminOnly, c.createTask);

router.get("/project/:projectId", protect, c.getMyProjectTasks);
router.get("/project/:projectId/summary", protect, c.getProjectProgressSummary);

router.put("/:id/progress", protect, c.updateTaskProgress);
router.put("/:id", protect, c.updateTask);

router.delete("/:id", protect, adminOnly, c.deleteTask);

module.exports = router;
