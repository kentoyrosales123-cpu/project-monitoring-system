const DailyReport = require("../models/DailyReport");
const User = require("../models/User");
const Notification = require("../models/Notification");
const cloudinary = require("../config/cloudinary");

function parseJsonArray(value) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

exports.getReports = async (req, res) => {
  try {
    const reports = await DailyReport.find()
      .populate("project", "name")
      .populate("submittedBy", "name")
      .populate("confirmedBy", "name")
      .populate("reviewedBy", "name")
      .sort({ reportDate: -1 });

    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createReport = async (req, res) => {
  try {
    const photos = (req.files || []).map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));

    const report = await DailyReport.create({
      project: req.body.project,
      reportDate: req.body.reportDate,
      weatherCondition: req.body.weatherCondition,
      workAccomplished: req.body.workAccomplished,

      manpower: parseJsonArray(req.body.manpower),
      equipmentUsed: parseJsonArray(req.body.equipmentUsed),
      materialsUsed: parseJsonArray(req.body.materialsUsed),

      issuesEncountered: req.body.issuesEncountered || "",
      safetyIncidents: req.body.safetyIncidents || "",
      remarks: req.body.remarks || "",

      photos,
      submittedBy: req.user._id,

      status: "Pending",
      isConfirmed: false,
      adminComments: "",
    });

    await report.populate("project", "name");

    const admins = await User.find({ role: "admin" }).select("_id");

    if (admins.length) {
      await Notification.insertMany(
        admins.map((admin) => ({
          user: admin._id,
          title: "📋 New Daily Report Submitted",
          message: `${req.user.name || "A staff member"} submitted a daily report for ${
            report.project?.name || "a project"
          }.`,
          type: "daily_report",
          isRead: false,
        })),
      );
    }

    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const report = await DailyReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found." });
    }

    for (const photo of report.photos || []) {
      if (photo.publicId) {
        await cloudinary.uploader.destroy(photo.publicId);
      }
    }

    await report.deleteOne();

    res.json({ message: "Report and photos deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.confirmReport = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admin can confirm daily reports.",
      });
    }

    const report = await DailyReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        message: "Daily report not found.",
      });
    }

    report.status = "Confirmed";
    report.isConfirmed = true;
    report.confirmedBy = req.user._id;
    report.confirmedAt = new Date();
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();

    if (req.body.adminComments !== undefined) {
      report.adminComments = req.body.adminComments;
    }

    await report.save();

    // Notify the staff who submitted the report
    await Notification.create({
      user: report.submittedBy,
      title: "✅ Daily Report Confirmed",
      message: "Your daily report has been confirmed by the admin.",
      type: "daily_report",
      isRead: false,
    });

    res.json({
      message: "Daily report confirmed successfully.",
      report,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.needsRevisionReport = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admin can request report revision.",
      });
    }

    const report = await DailyReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        message: "Daily report not found.",
      });
    }

    report.status = "Needs Revision";
    report.isConfirmed = false;
    report.adminComments =
      req.body.adminComments || "Please revise this daily report.";
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();

    report.confirmedBy = undefined;
    report.confirmedAt = undefined;

    await report.save();

    // Notify the staff who submitted the report
    await Notification.create({
      user: report.submittedBy,
      title: "✏️ Daily Report Needs Revision",
      message:
        req.body.adminComments ||
        "Your daily report needs revision. Please update and resubmit.",
      type: "daily_report",
      isRead: false,
    });

    res.json({
      message: "Daily report marked as Needs Revision.",
      report,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.updateReport = async (req, res) => {
  try {
    const report = await DailyReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found." });
    }

    if (report.status === "Confirmed" || report.isConfirmed) {
      return res.status(400).json({
        message: "Confirmed reports can no longer be edited.",
      });
    }

    if (
      req.user.role !== "admin" &&
      report.submittedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "You can only edit your own report.",
      });
    }

    report.project = req.body.project || report.project;
    report.reportDate = req.body.reportDate || report.reportDate;
    report.weatherCondition =
      req.body.weatherCondition || report.weatherCondition;
    report.workAccomplished =
      req.body.workAccomplished || report.workAccomplished;

    report.manpower = parseJsonArray(req.body.manpower);
    report.equipmentUsed = parseJsonArray(req.body.equipmentUsed);
    report.materialsUsed = parseJsonArray(req.body.materialsUsed);

    report.issuesEncountered = req.body.issuesEncountered || "";
    report.safetyIncidents = req.body.safetyIncidents || "";
    report.remarks = req.body.remarks || "";

    const newPhotos = (req.files || []).map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));

    if (newPhotos.length) {
      report.photos = [...report.photos, ...newPhotos];
    }

    if (report.status === "Needs Revision") {
      report.status = "Pending";
      report.isConfirmed = false;
    }

    // If admin edits the report, notify staff
    if (
      req.user.role === "admin" &&
      report.submittedBy.toString() !== req.user._id.toString()
    ) {
      await Notification.create({
        user: report.submittedBy,
        title: "📋 Daily Report Updated",
        message:
          "An admin updated your daily report. Please review the changes.",
        type: "daily_report",
        isRead: false,
      });
    }

    await report.save();

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
