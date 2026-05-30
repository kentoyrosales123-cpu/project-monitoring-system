const express = require("express");
const router = express.Router();

const { protect, adminOnly } = require("../middleware/authMiddleware");

const {
  createProductivity,
  getProductivityRecords,
  getProductivityById,
  updateProductivity,
  deleteProductivity,
  getProductivitySummary,
  getAIProductivitySummary,
} = require("../controllers/productivityController");

router.get("/", protect, getProductivityRecords);
router.get("/summary", protect, getProductivitySummary);
router.get("/ai-summary", protect, getAIProductivitySummary);
router.get("/:id", protect, getProductivityById);

router.post("/", protect, createProductivity);
router.put("/:id", protect, updateProductivity);
router.delete("/:id", protect, adminOnly, deleteProductivity);

module.exports = router;
