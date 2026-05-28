const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const { protect } = require("../middleware/authMiddleware");
const c = require("../controllers/expenseRequestController");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "public/uploads/expenses");
  },
  filename(req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];

    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, and PDF files are allowed."));
    }

    cb(null, true);
  },
});

router.get("/", protect, c.getExpenseRequests);
router.post("/", protect, upload.single("receipt"), c.createExpenseRequest);

router.get("/budget-summary/:projectId", protect, c.getExpenseBudgetSummary);
router.get("/analytics/summary", protect, c.getExpenseAnalytics);

router.put("/:id/approve", protect, c.approveExpenseRequest);
router.put("/:id/reject", protect, c.rejectExpenseRequest);
router.put("/:id/paid", protect, c.markExpenseRequestPaid);

module.exports = router;
