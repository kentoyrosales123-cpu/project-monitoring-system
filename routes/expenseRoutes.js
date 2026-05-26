const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const c = require("../controllers/expenseController");

router.get("/", protect, c.getExpenses);
router.post("/", protect, c.createExpense);
router.delete("/:id", protect, c.deleteExpense);

module.exports = router;
