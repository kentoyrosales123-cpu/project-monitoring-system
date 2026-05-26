const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  date: { type: Date, required: true },
  laborCost: { type: Number, default: 0 },
  materialCost: { type: Number, default: 0 },
  equipmentCost: { type: Number, default: 0 },
  otherExpenses: { type: Number, default: 0 },
  remarks: { type: String, default: '' },
}, { timestamps: true });

expenseSchema.virtual('totalExpense').get(function() {
  return this.laborCost + this.materialCost + this.equipmentCost + this.otherExpenses;
});
expenseSchema.set('toJSON', { virtuals: true });
expenseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Expense', expenseSchema);
