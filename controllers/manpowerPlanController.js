const ManpowerPlan = require("../models/ManpowerPlan");
const ManpowerAttendance = require("../models/ManpowerAttendance");
const Project = require("../models/Project");

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

exports.getPlans = async (req, res) => {
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

    const plans = await ManpowerPlan.find(filter)
      .populate("project", "name")
      .populate("encodedBy", "name")
      .sort({ date: -1 });

    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createPlan = async (req, res) => {
  try {
    const allowedProjectIds = await getAllowedProjectIds(req.user);

    if (!allowedProjectIds.includes(String(req.body.project))) {
      return res.status(403).json({ message: "Unauthorized project access." });
    }

    const plan = await ManpowerPlan.create({
      project: req.body.project,
      date: req.body.date,
      activity: req.body.activity,

      foreman: Number(req.body.foreman || 0),
      mason: Number(req.body.mason || 0),
      carpenter: Number(req.body.carpenter || 0),
      steelman: Number(req.body.steelman || 0),
      electrician: Number(req.body.electrician || 0),
      plumber: Number(req.body.plumber || 0),

      helpers: Number(req.body.helpers || 0),
      engineers: Number(req.body.engineers || 0),
      operators: Number(req.body.operators || 0),

      remarks: req.body.remarks || "",
      encodedBy: req.user._id,
    });

    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admin can delete manpower plans." });
    }

    const plan = await ManpowerPlan.findByIdAndDelete(req.params.id);

    if (!plan) {
      return res.status(404).json({ message: "Plan not found." });
    }

    res.json({ message: "Manpower plan deleted." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.comparison = async (req, res) => {
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

    const plans = await ManpowerPlan.find(filter)
      .populate("project", "name")
      .sort({ date: -1 });

    const attendance = await ManpowerAttendance.find(filter)
      .populate("project", "name")
      .sort({ date: -1 });

    const attendanceMap = {};

    attendance.forEach((a) => {
      const key = `${String(a.project?._id || a.project)}-${new Date(a.date)
        .toISOString()
        .slice(0, 10)}`;

      if (!attendanceMap[key]) {
        attendanceMap[key] = {
          foreman: 0,
          mason: 0,
          carpenter: 0,
          steelman: 0,
          electrician: 0,
          plumber: 0,

          helpers: 0,
          engineers: 0,
          operators: 0,

          totalPresent: 0,
        };
      }

      (a.workers || []).forEach((w) => {
        if (!["Present", "Late", "Half Day"].includes(w.status)) return;

        if (w.position === "Foreman") attendanceMap[key].foreman += 1;
        if (w.position === "Mason") attendanceMap[key].mason += 1;
        if (w.position === "Carpenter") attendanceMap[key].carpenter += 1;
        if (w.position === "Steelman") attendanceMap[key].steelman += 1;
        if (w.position === "Electrician") attendanceMap[key].electrician += 1;
        if (w.position === "Plumber") attendanceMap[key].plumber += 1;

        if (w.position === "Helper") attendanceMap[key].helpers += 1;
        if (w.position === "Engineer") attendanceMap[key].engineers += 1;
        if (w.position === "Operator") attendanceMap[key].operators += 1;

        attendanceMap[key].totalPresent += 1;
      });
    });

    const rows = plans.map((p) => {
      const key = `${String(p.project?._id || p.project)}-${new Date(p.date)
        .toISOString()
        .slice(0, 10)}`;

      const actual = attendanceMap[key] || {
        skilledWorkers: 0,
        helpers: 0,
        engineers: 0,
        operators: 0,
        totalPresent: 0,
      };

      const plannedTotal =
        Number(p.skilledWorkers || 0) +
        Number(p.helpers || 0) +
        Number(p.engineers || 0) +
        Number(p.operators || 0);

      const actualTotal =
        Number(actual.skilledWorkers || 0) +
        Number(actual.helpers || 0) +
        Number(actual.engineers || 0) +
        Number(actual.operators || 0);

      const shortages = {
        skilledWorkers: Math.max(
          0,
          Number(p.skilledWorkers || 0) - Number(actual.skilledWorkers || 0),
        ),
        helpers: Math.max(
          0,
          Number(p.helpers || 0) - Number(actual.helpers || 0),
        ),
        engineers: Math.max(
          0,
          Number(p.engineers || 0) - Number(actual.engineers || 0),
        ),
        operators: Math.max(
          0,
          Number(p.operators || 0) - Number(actual.operators || 0),
        ),
      };

      const excess = {
        skilledWorkers: Math.max(
          0,
          Number(actual.skilledWorkers || 0) - Number(p.skilledWorkers || 0),
        ),
        helpers: Math.max(
          0,
          Number(actual.helpers || 0) - Number(p.helpers || 0),
        ),
        engineers: Math.max(
          0,
          Number(actual.engineers || 0) - Number(p.engineers || 0),
        ),
        operators: Math.max(
          0,
          Number(actual.operators || 0) - Number(p.operators || 0),
        ),
      };

      const shortage =
        shortages.skilledWorkers +
        shortages.helpers +
        shortages.engineers +
        shortages.operators;

      let delayRisk = "Low";

      if (plannedTotal > 0) {
        const shortageRate = shortage / plannedTotal;

        if (shortageRate >= 0.5) delayRisk = "High";
        else if (shortageRate >= 0.25) delayRisk = "Medium";
      }

      return {
        _id: p._id,
        project: p.project,
        date: p.date,
        activity: p.activity,
        planned: {
          skilledWorkers: p.skilledWorkers,
          helpers: p.helpers,
          engineers: p.engineers,
          operators: p.operators,
          total: plannedTotal,
        },
        actual: {
          ...actual,
          total: actualTotal,
        },
        shortage,
        status:
          shortage > 0
            ? "Shortage"
            : actualTotal > plannedTotal
              ? "Overstaffed"
              : "Balanced",
        remarks: p.remarks,
      };
    });

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
