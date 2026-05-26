const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const c = require("../controllers/exportController");

router.get("/reports-excel", protect, c.exportReportsExcel);
router.get("/expenses-excel", protect, c.exportExpensesExcel);
router.get("/manpower-excel", protect, c.exportManpowerExcel);

module.exports = router;
