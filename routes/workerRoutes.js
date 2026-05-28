const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const c = require("../controllers/workerController");

router.get("/", protect, c.getWorkers);
router.post("/", protect, c.createWorker);
router.put("/:id", protect, c.updateWorker);
router.delete("/:id", protect, c.deleteWorker);

module.exports = router;
