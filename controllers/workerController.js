const Worker = require("../models/Worker");
const Project = require("../models/Project");

const projectFilter = async (user) => {
  if (["admin", "inventory"].includes(user.role)) return {};

  if (user.role === "staff") {
    const projects = await Project.find({ assignedStaff: user._id }).select(
      "_id",
    );

    return {
      assignedProject: { $in: projects.map((p) => p._id) },
    };
  }

  return {};
};

exports.getWorkers = async (req, res) => {
  try {
    const filter = await projectFilter(req.user);

    const workers = await Worker.find(filter)
      .populate("assignedProject", "name")
      .sort({ createdAt: -1 });

    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createWorker = async (req, res) => {
  try {
    if (!["admin", "inventory"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Only admin/inventory can add workers.",
      });
    }

    const worker = await Worker.create({
      fullName: req.body.fullName,
      position: req.body.position,
      contactNumber: req.body.contactNumber || "",
      ratePerDay: Number(req.body.ratePerDay || 0),
      status: req.body.status || "Available",
      assignedProject: req.body.assignedProject || null,
      remarks: req.body.remarks || "",
    });

    res.status(201).json(worker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateWorker = async (req, res) => {
  try {
    if (!["admin", "inventory"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Only admin/inventory can update workers.",
      });
    }

    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      {
        fullName: req.body.fullName,
        position: req.body.position,
        contactNumber: req.body.contactNumber || "",
        ratePerDay: Number(req.body.ratePerDay || 0),
        status: req.body.status || "Available",
        assignedProject: req.body.assignedProject || null,
        remarks: req.body.remarks || "",
      },
      { new: true, runValidators: true },
    );

    if (!worker) {
      return res.status(404).json({ message: "Worker not found." });
    }

    res.json(worker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteWorker = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admin can delete workers.",
      });
    }

    const worker = await Worker.findByIdAndDelete(req.params.id);

    if (!worker) {
      return res.status(404).json({ message: "Worker not found." });
    }

    res.json({ message: "Worker deleted." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
