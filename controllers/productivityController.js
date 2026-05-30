const Productivity = require("../models/Productivity");
const Project = require("../models/Project");
const Notification = require("../models/Notification");
const User = require("../models/User");

exports.createProductivity = async (req, res) => {
  try {
    const {
      project,
      task,
      workItem,
      date,
      workers,
      attendance,
      plannedOutput,
      actualOutput,
      unit,
      remarks,
    } = req.body;

    if (!project || !workItem) {
      return res.status(400).json({
        message: "Project and work item are required",
      });
    }

    const projectExists = await Project.findById(project);

    if (!projectExists) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const productivityRate =
      Number(plannedOutput || 0) > 0
        ? Math.round(
            (Number(actualOutput || 0) / Number(plannedOutput || 0)) * 100,
          )
        : 0;

    const productivityHealth =
      productivityRate >= 90
        ? "Excellent"
        : productivityRate >= 75
          ? "Good"
          : productivityRate >= 60
            ? "Average"
            : productivityRate >= 40
              ? "Poor"
              : "Critical";

    const delayRisk =
      productivityRate < 60 ? "High" : productivityRate < 75 ? "Medium" : "Low";

    const aiRecommendation =
      productivityRate < 40
        ? "Increase manpower immediately and review execution strategy."
        : productivityRate < 60
          ? "Add workers or overtime to avoid schedule delay."
          : productivityRate < 75
            ? "Monitor worker performance and optimize workflow."
            : "Current productivity is healthy.";

    const productivity = await Productivity.create({
      project,
      task: task || null,
      workItem,
      date,
      workers,
      attendance,
      plannedOutput,
      actualOutput,
      unit,
      remarks,
      productivityHealth,
      delayRisk,
      aiRecommendation,
      createdBy: req.user?._id,
    });

    if (productivityRate < 60) {
      const admins = await User.find({ role: "admin" }).select("_id");

      for (const admin of admins) {
        await Notification.create({
          user: admin._id,
          title: "⚠ Low Productivity Alert",
          message: `${workItem} productivity dropped to ${productivityRate}% in ${projectExists.name}.

Risk: HIGH
Recommendation:
${aiRecommendation}`,
          type: "low_productivity",
          isRead: false,
        });
      }
    }

    res.status(201).json(productivity);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create productivity record",
      error: error.message,
    });
  }
};

exports.getProductivityRecords = async (req, res) => {
  try {
    const { project, dateFrom, dateTo } = req.query;

    const filter = {};

    if (project) filter.project = project;

    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    const records = await Productivity.find(filter)
      .populate("project", "name projectName")
      .populate("task", "title")
      .populate("createdBy", "name email role")
      .sort({ date: -1, createdAt: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch productivity records",
      error: error.message,
    });
  }
};

exports.getProductivityById = async (req, res) => {
  try {
    const record = await Productivity.findById(req.params.id)
      .populate("project", "name projectName")
      .populate("task", "title")
      .populate("createdBy", "name email role");

    if (!record) {
      return res.status(404).json({
        message: "Productivity record not found",
      });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch productivity record",
      error: error.message,
    });
  }
};

exports.updateProductivity = async (req, res) => {
  try {
    const record = await Productivity.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    if (!record) {
      return res.status(404).json({
        message: "Productivity record not found",
      });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update productivity record",
      error: error.message,
    });
  }
};

exports.deleteProductivity = async (req, res) => {
  try {
    const record = await Productivity.findByIdAndDelete(req.params.id);

    if (!record) {
      return res.status(404).json({
        message: "Productivity record not found",
      });
    }

    res.json({
      message: "Productivity record deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete productivity record",
      error: error.message,
    });
  }
};

exports.getProductivitySummary = async (req, res) => {
  try {
    const { project } = req.query;

    const filter = {};

    if (project) {
      filter.project = project;
    }

    const records = await Productivity.find(filter).populate("project", "name");

    const totalPlanned = records.reduce(
      (sum, r) => sum + Number(r.plannedOutput || 0),
      0,
    );

    const totalActual = records.reduce(
      (sum, r) => sum + Number(r.actualOutput || 0),
      0,
    );

    const totalAttendance = records.reduce(
      (sum, r) => sum + Number(r.attendance || 0),
      0,
    );

    const totalWorkers = records.reduce(
      (sum, r) => sum + Number(r.workers || 0),
      0,
    );

    const averageRate =
      totalPlanned > 0
        ? Number(((totalActual / totalPlanned) * 100).toFixed(2))
        : 0;

    const attendanceEfficiency =
      totalWorkers > 0
        ? Number(((totalAttendance / totalWorkers) * 100).toFixed(2))
        : 0;

    const healthStats = {
      Excellent: 0,
      Good: 0,
      Average: 0,
      Poor: 0,
      Critical: 0,
    };

    const riskStats = {
      Low: 0,
      Medium: 0,
      High: 0,
    };

    const trendData = {};

    records.forEach((r) => {
      healthStats[r.productivityHealth]++;

      riskStats[r.delayRisk]++;

      const day = new Date(r.date).toISOString().slice(0, 10);

      if (!trendData[day]) {
        trendData[day] = {
          planned: 0,
          actual: 0,
        };
      }

      trendData[day].planned += Number(r.plannedOutput || 0);

      trendData[day].actual += Number(r.actualOutput || 0);
    });

    const productivityTrend = Object.keys(trendData).map((date) => ({
      date,
      planned: trendData[date].planned,
      actual: trendData[date].actual,
    }));

    const lowPerformance = records.filter(
      (r) => r.productivityRate < 60,
    ).length;

    res.json({
      totalRecords: records.length,
      totalPlanned,
      totalActual,
      averageRate,
      attendanceEfficiency,
      lowPerformance,
      healthStats,
      riskStats,
      productivityTrend,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch productivity summary",
      error: error.message,
    });
  }
};

exports.getAIProductivitySummary = async (req, res) => {
  try {
    const { project } = req.query;

    const records = await Productivity.find({
      project,
    });

    const totalPlanned = records.reduce(
      (sum, r) => sum + Number(r.plannedOutput || 0),
      0,
    );

    const totalActual = records.reduce(
      (sum, r) => sum + Number(r.actualOutput || 0),
      0,
    );

    const productivityScore =
      totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0;

    let projectHealth = "Good";
    let risk = "Low";

    if (productivityScore < 60) {
      projectHealth = "Poor";
      risk = "High";
    } else if (productivityScore < 75) {
      projectHealth = "Average";
      risk = "Medium";
    }

    res.json({
      productivityScore,
      projectHealth,
      risk,

      insight:
        risk === "High"
          ? "Project may experience delays within 7–14 days."
          : "Project productivity is stable.",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
