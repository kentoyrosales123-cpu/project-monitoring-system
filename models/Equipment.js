const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  equipmentName: { type: String, required: true },
  status: { type: String, enum: ['Available', 'In Use', 'Maintenance'], default: 'Available' },
  usageDate: { type: Date },
  remarks: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Equipment', equipmentSchema);
