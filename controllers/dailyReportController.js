const DailyReport = require('../models/DailyReport');

exports.getReports = async (req, res) => {
  const reports = await DailyReport.find().populate('project', 'name').populate('submittedBy', 'name').sort({ reportDate: -1 });
  res.json(reports);
};

exports.createReport = async (req, res) => {
  const photos = (req.files || []).map(file => `/uploads/${file.filename}`);
  const report = await DailyReport.create({ ...req.body, photos, submittedBy: req.user._id });
  res.status(201).json(report);
};

exports.deleteReport = async (req, res) => {
  const report = await DailyReport.findByIdAndDelete(req.params.id);
  if (!report) return res.status(404).json({ message: 'Report not found.' });
  res.json({ message: 'Report deleted.' });
};
