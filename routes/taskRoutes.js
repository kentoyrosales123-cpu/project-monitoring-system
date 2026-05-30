const router = require("express").Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const c = require("../controllers/taskController");

router.get("/", protect, c.getTasks);
router.post("/", protect, adminOnly, c.createTask);

router.get("/project/:projectId", protect, c.getMyProjectTasks);
router.get("/project/:projectId/summary", protect, c.getProjectProgressSummary);

router.put("/:id/progress", protect, c.updateTaskProgress);
router.put("/:id", protect, c.updateTask);
router.put("/:id/assign-worker", protect, c.assignTaskToWorker);
router.put("/:id/confirm-done", protect, c.confirmTaskDone);
router.put("/:id/verify-worker", protect, c.verifyWorkerTask);

router.delete("/:id", protect, adminOnly, c.deleteTask);

module.exports = router;
