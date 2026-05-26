const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const c = require("../controllers/manpowerController");

router.get("/", protect, c.getManpower);
router.post("/", protect, c.createManpower);
router.delete("/:id", protect, c.deleteManpower);

module.exports = router;
