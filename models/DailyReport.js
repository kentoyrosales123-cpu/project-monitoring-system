const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  reportDate: { type: Date, required: true },
  weatherCondition: { type: String, required: true },
  workAccomplished: { type: String, required: true },
  manpowerCount: { type: Number, default: 0 },
  equipmentUsed: { type: String, default: '' },
  materialsUsed: { type: String, default: '' },
  issuesEncountered: { type: String, default: '' },
  safetyIncidents: { type: String, default: '' },
  remarks: { type: String, default: '' },
  photos: [{ type: String }],
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('DailyReport', dailyReportSchema);
