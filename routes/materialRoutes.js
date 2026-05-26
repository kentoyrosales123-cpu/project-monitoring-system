const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const materialController = require("../controllers/materialController");

router.get("/", protect, materialController.getMaterials);
router.post("/", protect, materialController.createMaterial);
router.delete("/:id", protect, materialController.deleteMaterial);

module.exports = router;
