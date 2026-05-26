const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved'], default: 'Open' },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dateReported: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Issue', issueSchema);
