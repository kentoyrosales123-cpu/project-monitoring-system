const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const c = require("../controllers/exportController");

router.get("/reports-excel", protect, c.exportReportsExcel);
router.get("/expenses-excel", protect, c.exportExpensesExcel);
router.get("/manpower-excel", protect, c.exportManpowerExcel);
router.get("/manpower-plans-excel", protect, c.exportManpowerPlansExcel);
router.get("/material-requests-excel", protect, c.exportMaterialRequestsExcel);
router.get("/productivity-excel", protect, c.exportProductivityExcel);

router.get("/report-pdf/:id", protect, c.exportReportPdf);

router.get("/expense-requests-excel", protect, c.exportExpenseRequestsExcel);

module.exports = router;
