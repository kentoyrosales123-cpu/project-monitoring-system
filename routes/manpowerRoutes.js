const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const manpowerController = require("../controllers/manpowerController");

router.get("/", protect, manpowerController.getManpower);
router.post("/", protect, manpowerController.createManpower);
router.delete("/:id", protect, manpowerController.deleteManpower);

module.exports = router;
