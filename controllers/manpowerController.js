const Manpower = require("../models/Manpower");
const Project = require("../models/Project");

const getAllowedProjectIds = async (user) => {
  if (["admin", "inventory"].includes(user.role)) {
    const projects = await Project.find().select("_id");
    return projects.map((p) => String(p._id));
  }

  if (user.role === "staff") {
    const projects = await Project.find({
      assignedStaff: user._id,
    }).select("_id");

    return projects.map((p) => String(p._id));
  }

  return [];
};

exports.getManpower = async (req, res) => {
  try {
    const allowedProjectIds = await getAllowedProjectIds(req.user);

    const filter = {
      project: { $in: allowedProjectIds },
    };

    if (req.query.project) {
      if (!allowedProjectIds.includes(String(req.query.project))) {
        return res.status(403).json({
          message: "You are not allowed to view this project's manpower.",
        });
      }

      filter.project = req.query.project;
    }

    const rows = await Manpower.find(filter)
      .populate("project", "name")
      .populate("encodedBy", "name")
      .sort({ date: -1 });

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createManpower = async (req, res) => {
  try {
    const allowedProjectIds = await getAllowedProjectIds(req.user);

    if (!allowedProjectIds.includes(String(req.body.project))) {
      return res.status(403).json({
        message: "You are not allowed to add manpower to this project.",
      });
    }

    const manpower = await Manpower.create({
      project: req.body.project,
      date: req.body.date,
      skilledWorkers: Number(req.body.skilledWorkers || 0),
      helpers: Number(req.body.helpers || 0),
      engineers: Number(req.body.engineers || 0),
      operators: Number(req.body.operators || 0),
      remarks: req.body.remarks || "",
      encodedBy: req.user._id,
    });

    res.status(201).json(manpower);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteManpower = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admin can delete manpower records.",
      });
    }

    const manpower = await Manpower.findByIdAndDelete(req.params.id);

    if (!manpower) {
      return res.status(404).json({ message: "Manpower record not found." });
    }

    res.json({ message: "Manpower record deleted." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
