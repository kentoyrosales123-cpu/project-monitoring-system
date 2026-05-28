const ManpowerAttendance = require("../models/ManpowerAttendance");
const Project = require("../models/Project");
const Expense = require("../models/Expense");

const getAllowedProjectIds = async (user) => {
  if (["admin", "inventory"].includes(user.role)) {
    const projects = await Project.find().select("_id");
    return projects.map((p) => String(p._id));
  }

  if (user.role === "staff") {
    const projects = await Project.find({ assignedStaff: user._id }).select(
      "_id",
    );
    return projects.map((p) => String(p._id));
  }

  return [];
};

const computeAttendance = (workers = []) => {
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalLate = 0;
  let totalOvertimeHours = 0;
  let totalLaborCost = 0;

  workers.forEach((w) => {
    const rate = Number(w.ratePerDay || 0);
    const ot = Number(w.overtimeHours || 0);
    const otRate = rate / 8;

    if (["Present", "Late", "Half Day"].includes(w.status)) totalPresent++;
    if (w.status === "Absent") totalAbsent++;
    if (w.status === "Late") totalLate++;

    totalOvertimeHours += ot;

    if (w.status === "Present" || w.status === "Late") {
      totalLaborCost += rate + ot * otRate;
    }

    if (w.status === "Half Day") {
      totalLaborCost += rate / 2 + ot * otRate;
    }
  });

  return {
    totalPresent,
    totalAbsent,
    totalLate,
    totalOvertimeHours,
    totalLaborCost,
  };
};

exports.getAttendance = async (req, res) => {
  try {
    const allowedProjectIds = await getAllowedProjectIds(req.user);

    const filter = {
      project: { $in: allowedProjectIds },
    };

    if (req.query.project) {
      if (!allowedProjectIds.includes(String(req.query.project))) {
        return res
          .status(403)
          .json({ message: "Unauthorized project access." });
      }

      filter.project = req.query.project;
    }

    if (req.query.from || req.query.to) {
      filter.date = {};

      if (req.query.from) filter.date.$gte = new Date(req.query.from);
      if (req.query.to) filter.date.$lte = new Date(req.query.to);
    }

    const rows = await ManpowerAttendance.find(filter)
      .populate("project", "name")
      .populate("encodedBy", "name")
      .sort({ date: -1 });

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createAttendance = async (req, res) => {
  try {
    const allowedProjectIds = await getAllowedProjectIds(req.user);

    if (!allowedProjectIds.includes(String(req.body.project))) {
      return res.status(403).json({ message: "Unauthorized project access." });
    }

    const workers = Array.isArray(req.body.workers) ? req.body.workers : [];
    const computed = computeAttendance(workers);

    const attendance = await ManpowerAttendance.create({
      project: req.body.project,
      date: req.body.date,
      workers,
      remarks: req.body.remarks || "",
      encodedBy: req.user._id,
      ...computed,
    });

    if (computed.totalLaborCost > 0) {
      await Expense.create({
        project: req.body.project,
        date: req.body.date,
        laborCost: computed.totalLaborCost,
        materialCost: 0,
        equipmentCost: 0,
        otherExpenses: 0,
        remarks: `Auto labor cost from manpower attendance. Attendance ID: ${attendance._id}`,
      });
    }

    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAttendance = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admin can delete attendance." });
    }

    const deleted = await ManpowerAttendance.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Attendance record not found." });
    }

    res.json({ message: "Attendance deleted." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.analytics = async (req, res) => {
  try {
    const allowedProjectIds = await getAllowedProjectIds(req.user);

    const filter = {
      project: { $in: allowedProjectIds },
    };

    if (req.query.project) {
      if (!allowedProjectIds.includes(String(req.query.project))) {
        return res
          .status(403)
          .json({ message: "Unauthorized project access." });
      }

      filter.project = req.query.project;
    }

    const rows = await ManpowerAttendance.find(filter)
      .populate("project", "name")
      .sort({ date: 1 });

    const summary = rows.reduce(
      (acc, r) => {
        acc.present += Number(r.totalPresent || 0);
        acc.absent += Number(r.totalAbsent || 0);
        acc.late += Number(r.totalLate || 0);
        acc.overtime += Number(r.totalOvertimeHours || 0);
        acc.laborCost += Number(r.totalLaborCost || 0);
        return acc;
      },
      { present: 0, absent: 0, late: 0, overtime: 0, laborCost: 0 },
    );

    const shortageAlerts = rows
      .filter((r) => Number(r.totalPresent || 0) < 5)
      .map((r) => ({
        project: r.project?.name || "Project",
        date: r.date,
        present: r.totalPresent,
        message: "Possible manpower shortage detected.",
      }));

    res.json({
      summary,
      trend: rows.map((r) => ({
        date: r.date,
        present: r.totalPresent,
        absent: r.totalAbsent,
        laborCost: r.totalLaborCost,
      })),
      shortageAlerts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
