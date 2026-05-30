const ManpowerRequest = require("../models/ManpowerRequest");
const Project = require("../models/Project");
const Worker = require("../models/Worker");
const User = require("../models/User");
const createNotification = require("../utils/createNotification");

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

exports.getRequests = async (req, res) => {
  try {
    const allowedProjectIds = await getAllowedProjectIds(req.user);

    const rows = await ManpowerRequest.find({
      project: { $in: allowedProjectIds },
    })
      .populate("project", "name")
      .populate("requestedBy", "name")
      .populate("reviewedBy", "name")
      .populate(
        "assignedWorkers",
        "fullName position ratePerDay assignedProject",
      )
      .sort({ createdAt: -1 });

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createRequest = async (req, res) => {
  try {
    const allowedProjectIds = await getAllowedProjectIds(req.user);

    if (!allowedProjectIds.includes(String(req.body.project))) {
      return res.status(403).json({ message: "Unauthorized project access." });
    }

    if (!req.body.assignmentStartDate || !req.body.assignmentEndDate) {
      return res.status(400).json({
        message: "Assignment start date and end date are required.",
      });
    }

    if (
      new Date(req.body.assignmentEndDate) <
      new Date(req.body.assignmentStartDate)
    ) {
      return res.status(400).json({
        message: "End date cannot be earlier than start date.",
      });
    }

    const request = await ManpowerRequest.create({
      project: req.body.project,
      position: req.body.position,
      quantityNeeded: Number(req.body.quantityNeeded || 0),
      neededDate: req.body.neededDate,
      assignmentStartDate: req.body.assignmentStartDate,
      assignmentEndDate: req.body.assignmentEndDate,
      neededDate: req.body.assignmentStartDate,
      reason: req.body.reason || "",
      requestedBy: req.user._id,
    });

    const adminUsers = await User.find({
      role: { $in: ["admin", "inventory"] },
    });

    for (const admin of adminUsers) {
      await createNotification({
        user: admin._id,
        title: "New Manpower Request",
        message: `${req.user.name} requested ${request.quantityNeeded} ${request.position} worker(s).`,
        type: "material_request",
      });
    }

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.reviewRequest = async (req, res) => {
  try {
    if (!["admin", "inventory"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Only admin/inventory can review requests." });
    }

    const request = await ManpowerRequest.findById(req.params.id);

    if (!request)
      return res.status(404).json({ message: "Request not found." });

    if (!["approve", "reject"].includes(req.params.action)) {
      return res.status(400).json({
        message: "Invalid request action.",
      });
    }

    request.status = req.params.action === "approve" ? "Approved" : "Rejected";
    request.reviewedBy = req.user._id;
    request.adminRemarks = req.body.adminRemarks || "";

    await request.save();

    await createNotification({
      user: request.requestedBy,
      title:
        request.status === "Approved"
          ? "Manpower Request Approved"
          : "Manpower Request Rejected",
      message:
        request.status === "Approved"
          ? "Your manpower request has been approved."
          : "Your manpower request has been rejected.",
      type: request.status === "Approved" ? "approved" : "rejected",
    });

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAssigned = async (req, res) => {
  try {
    if (!["admin", "inventory"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Only admin/inventory can assign manpower.",
      });
    }

    const request = await ManpowerRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }

    if (request.status !== "Approved") {
      return res.status(400).json({
        message: "Only approved requests can be assigned.",
      });
    }

    const selectedWorkerIds = req.body.workerIds || [];

    if (selectedWorkerIds.length !== Number(request.quantityNeeded || 0)) {
      return res.status(400).json({
        message: `Please select exactly ${request.quantityNeeded} worker(s).`,
      });
    }

    const workers = await Worker.find({
      _id: { $in: selectedWorkerIds },
      status: "Available",
      position: request.position,
      $or: [{ assignedProject: null }, { assignedProject: { $exists: false } }],
    });
    if (workers.length !== selectedWorkerIds.length) {
      return res.status(400).json({
        message:
          "Some selected workers are invalid, inactive, or do not match the requested position.",
      });
    }

    await Worker.updateMany(
      { _id: { $in: selectedWorkerIds } },
      {
        assignedProject: request.project,
        status: "Assigned",
      },
    );

    const assignedWorkers = await Worker.find({
      _id: { $in: selectedWorkerIds },
    }).populate("user", "name");

    const project = await Project.findById(request.project).select("name");

    for (const worker of assignedWorkers) {
      if (!worker.user) continue;

      await createNotification({
        user: worker.user._id,
        title: "Assigned to Project",
        message: `You have been assigned to ${project?.name || "a project"}.`,
        type: "worker_assigned",
      });
    }

    request.status = "Assigned";
    request.reviewedBy = req.user._id;
    request.assignedWorkers = selectedWorkerIds;
    request.adminRemarks =
      req.body.adminRemarks || "Workers manually assigned.";

    await request.save();

    await createNotification({
      user: request.requestedBy,
      title: "Worker Assigned",
      message: `${selectedWorkerIds.length} worker(s) have been assigned to your manpower request.`,
      type: "worker_assigned",
    });

    res.json({
      message: "Workers assigned successfully.",
      request,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.unassignWorkers = async (req, res) => {
  try {
    if (!["admin", "inventory"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Only admin/inventory can unassign workers.",
      });
    }

    const request = await ManpowerRequest.findById(req.params.id).populate(
      "assignedWorkers",
      "fullName user",
    );

    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }

    const project = await Project.findById(request.project).select("name");
    const workersBeforeUnassign = request.assignedWorkers || [];

    await Worker.updateMany(
      { _id: { $in: request.assignedWorkers || [] } },
      {
        assignedProject: null,
        status: "Available",
      },
    );

    request.status = "Approved";
    request.assignedWorkers = [];
    request.adminRemarks = req.body.adminRemarks || "Workers unassigned.";

    await request.save();

    await createNotification({
      user: request.requestedBy,
      title: "Worker Unassigned",
      message: `${workersBeforeUnassign.length} worker(s) have been unassigned from your manpower request.`,
      type: "worker_unassigned",
    });

    for (const worker of workersBeforeUnassign) {
      if (!worker.user) continue;

      await createNotification({
        user: worker.user,
        title: "Removed from Project",
        message: `You have been unassigned from ${project?.name || "the project"}.`,
        type: "worker_unassigned",
      });
    }

    res.json({
      message: "Workers unassigned successfully.",
      request,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.releaseExpiredAssignments = async () => {
  const now = new Date();

  const expiredRequests = await ManpowerRequest.find({
    status: "Assigned",
    assignmentEndDate: { $lt: now },
    assignmentReleasedAt: null,
  });

  for (const request of expiredRequests) {
    await Worker.updateMany(
      { _id: { $in: request.assignedWorkers || [] } },
      {
        assignedProject: null,
        status: "Available",
      },
    );

    request.status = "Completed";
    request.assignmentReleasedAt = now;
    request.adminRemarks =
      request.adminRemarks ||
      "Workers automatically released after assignment end date.";

    await request.save();
  }

  return expiredRequests.length;
};
