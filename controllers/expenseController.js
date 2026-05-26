const Expense = require("../models/Expense");

exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find()
      .populate("project", "name")
      .sort({ date: -1, createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const {
      project,
      date,
      laborCost,
      materialCost,
      equipmentCost,
      otherExpenses,
      remarks,
    } = req.body;

    if (!project || !date) {
      return res.status(400).json({
        message: "Project and date are required.",
      });
    }

    const expense = await Expense.create({
      project,
      date,
      laborCost: Number(laborCost || 0),
      materialCost: Number(materialCost || 0),
      equipmentCost: Number(equipmentCost || 0),
      otherExpenses: Number(otherExpenses || 0),
      remarks: remarks || "",
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    res.json({ message: "Expense deleted." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
