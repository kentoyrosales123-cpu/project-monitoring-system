const Task = require("../models/Task");
const Project = require("../models/Project");
const Notification = require("../models/Notification");
const Worker = require("../models/Worker");
const Productivity = require("../models/Productivity");
const User = require("../models/User");

async function recalculateProjectProgress(projectId) {
  const tasks = await Task.find({ project: projectId });

  if (!tasks.length) {
    await Project.findByIdAndUpdate(projectId, {
      progress: 0,
      status: "Planned",
    });
    return;
  }

  const doneTasks = tasks.filter((t) => t.status === "Done").length;
  const progress = Math.round((doneTasks / tasks.length) * 100);

  let status = "Planned";

  if (progress > 0 && progress < 100) {
    status = "Ongoing";
  }

  if (progress === 100) {
    status = "Completed";
  }

  const hasDelayed = tasks.some((t) => t.status === "Delayed");

  if (hasDelayed && progress < 100) {
    status = "Delayed";
  }

  await Project.findByIdAndUpdate(projectId, {
    progress,
    status,
  });
}

const taskFilter = async (user) => {
  if (user.role === "admin") return {};

  if (user.role === "staff") {
    const projects = await Project.find({
      assignedStaff: user._id,
    }).select("_id");

    const projectIds = projects.map((p) => p._id);

    return {
      $or: [{ assignedTo: user._id }, { project: { $in: projectIds } }],
    };
  }

  if (user.role === "client") {
    const projects = await Project.find({
      clientUser: user._id,
    }).select("_id");

    return {
      project: { $in: projects.map((p) => p._id) },
    };
  }

  return {};
};

exports.getTasks = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "staff") {
      const assignedProjects = await Project.find({
        assignedStaff: req.user._id,
      }).select("_id");

      const projectIds = assignedProjects.map((p) => p._id);

      filter = {
        $or: [{ assignedTo: req.user._id }, { project: { $in: projectIds } }],
      };
    }

    if (req.user.role === "client") {
      const clientProjects = await Project.find({
        clientUser: req.user._id,
      }).select("_id");

      filter = {
        project: { $in: clientProjects.map((p) => p._id) },
      };
    }

    if (req.query.project) {
      if (filter.$or) {
        filter = {
          $and: [{ $or: filter.$or }, { project: req.query.project }],
        };
      } else {
        filter.project = req.query.project;
      }
    }

    const tasks = await Task.find(filter)
      .populate("project", "name")
      .populate("assignedTo", "name email role")
      .populate("assignedWorkers", "fullName position user")
      .populate("createdBy", "name")
      .sort({ dueDate: 1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.createTask = async (req, res) => {
  try {
    const data = { ...req.body };

    if (!data.assignedTo) {
      data.assignedTo = null;
    }

    const task = await Task.create({
      ...data,
      createdBy: req.user._id,
    });

    await recalculateProjectProgress(task.project);

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    if (
      req.user.role !== "admin" &&
      String(task.assignedTo) !== String(req.user._id)
    ) {
      return res.status(403).json({
        message: "You can only update your assigned task.",
      });
    }

    if (req.user.role === "client") {
      return res.status(403).json({
        message: "Client account is view-only.",
      });
    }

    task.title = req.body.title || task.title;
    task.description = req.body.description ?? task.description;
    task.assignedTo = req.body.assignedTo || null;
    task.startDate = req.body.startDate || task.startDate;
    task.dueDate = req.body.dueDate || task.dueDate;
    task.priority = req.body.priority || task.priority;
    task.status = req.body.status || task.status;
    task.remarks = req.body.remarks ?? task.remarks;

    await task.save();

    await recalculateProjectProgress(task.project);

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    const projectId = task.project;

    await task.deleteOne();

    await recalculateProjectProgress(projectId);

    res.json({ message: "Task deleted." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;

    const tasks = await Task.find({
      project: projectId,
    })
      .populate("project", "projectName")
      .populate("assignedTo", "name email")
      .sort({ startDate: 1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTaskProgress = async (req, res) => {
  try {
    const { progress, status } = req.body;

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        progress: Number(progress),
        status: Number(progress) >= 100 ? "Done" : status || "Ongoing",
      },
      { new: true },
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({
      message: "Task progress updated successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProjectProgressSummary = async (req, res) => {
  try {
    const { projectId } = req.params;

    const tasks = await Task.find({ project: projectId });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "Done").length;

    const averageProgress =
      totalTasks > 0
        ? Math.round(
            tasks.reduce((sum, t) => sum + Number(t.progress || 0), 0) /
              totalTasks,
          )
        : 0;

    res.json({
      totalTasks,
      completedTasks,
      pendingTasks: tasks.filter((t) => t.status === "Pending").length,
      inProgressTasks: tasks.filter((t) => t.status === "In Progress").length,
      delayedTasks: tasks.filter((t) => t.status === "Delayed").length,
      averageProgress,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.assignTaskToWorker = async (req, res) => {
  const task = await Task.findById(req.params.id).populate("project", "name");

  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  const assignedWorkers = req.body.assignedWorkers || [];

  task.assignedWorkers = assignedWorkers;

  task.workerConfirmations = assignedWorkers.map((workerId) => ({
    worker: workerId,
    status: "Pending",
  }));

  task.workerStatus = "Pending";
  task.status = "Pending";
  task.progress = 0;

  await task.save();

  const workers = await Worker.find({
    _id: { $in: assignedWorkers },
  }).populate("user", "_id name");

  const notifications = workers
    .filter((w) => w.user)
    .map((w) => ({
      user: w.user._id,
      title: "New Task Assigned",
      message: `You have been assigned to task "${task.title}" under project "${task.project?.name || "Project"}".`,
      type: "worker_assigned",
    }));

  if (notifications.length) {
    await Notification.insertMany(notifications);
  }

  res.json({
    message: "Task assigned to workers and notifications sent",
    task,
  });
};

exports.confirmTaskDone = async (req, res) => {
  try {
    const { workerId } = req.body;

    const task = await Task.findById(req.params.id)
      .populate("project", "name assignedStaff")
      .populate("assignedTo", "name email");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const confirmation = task.workerConfirmations.find((c) => {
      return String(c.worker) === String(workerId);
    });

    if (!confirmation) {
      return res.status(403).json({
        message: "You are not assigned to this task.",
      });
    }

    confirmation.status = "Submitted";
    confirmation.confirmedAt = new Date();

    task.workerStatus = "For Verification";
    task.status = "For Verification";

    await task.save();

    const staffToNotify = [];

    if (task.assignedTo?._id || task.assignedTo) {
      staffToNotify.push(task.assignedTo._id || task.assignedTo);
    }

    if (Array.isArray(task.project?.assignedStaff)) {
      task.project.assignedStaff.forEach((staffId) => {
        staffToNotify.push(staffId);
      });
    }

    const uniqueStaff = [...new Set(staffToNotify.map((id) => String(id)))];

    if (uniqueStaff.length) {
      await Notification.insertMany(
        uniqueStaff.map((staffId) => ({
          user: staffId,
          title: "Task Needs Verification",
          message: `A worker submitted "${task.title}" for verification in project "${task.project?.name || "Project"}".`,
          type: "task_verification",
        })),
      );
    }

    res.json({
      message: "Work submitted for staff verification.",
      task,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyWorkerTask = async (req, res) => {
  try {
    const { workerId, plannedOutput, actualOutput, unit, remarks } = req.body;

    const task = await Task.findById(req.params.id)
      .populate("project", "name")
      .populate("assignedWorkers", "fullName position user");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (
      req.user.role !== "admin" &&
      String(task.assignedTo) !== String(req.user._id)
    ) {
      return res.status(403).json({
        message: "Only the assigned staff or admin can verify this work.",
      });
    }

    const confirmation = task.workerConfirmations.find((c) => {
      return String(c.worker) === String(workerId);
    });

    if (!confirmation) {
      return res.status(404).json({
        message: "Worker confirmation not found.",
      });
    }

    if (confirmation.status !== "Submitted") {
      return res.status(400).json({
        message: "Worker has not submitted this work for verification yet.",
      });
    }

    confirmation.status = "Verified";
    confirmation.verifiedAt = new Date();

    const totalWorkers = task.workerConfirmations.length;

    const verifiedWorkers = task.workerConfirmations.filter((c) => {
      return c.status === "Verified";
    }).length;

    task.workerStatus =
      totalWorkers > 0 && verifiedWorkers === totalWorkers
        ? "Verified"
        : "For Verification";

    if (totalWorkers > 0 && verifiedWorkers === totalWorkers) {
      task.status = "Done";
      task.progress = 100;
    } else {
      task.status = "For Verification";
      task.progress =
        totalWorkers > 0
          ? Math.round((verifiedWorkers / totalWorkers) * 100)
          : 0;
    }

    await task.save();

    const allWorkersVerified =
      totalWorkers > 0 &&
      verifiedWorkers === totalWorkers &&
      task.workerConfirmations.every((c) => c.status === "Verified");

    const taskFullyCompleted =
      task.status === "Done" && Number(task.progress) === 100;

    if (
      allWorkersVerified &&
      taskFullyCompleted &&
      !task.productivityRecorded
    ) {
      const planned = Number(plannedOutput || 1);
      const actual = Number(actualOutput || planned);

      const productivityRate =
        planned > 0 ? Math.round((actual / planned) * 100) : 0;

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
        productivityRate < 60
          ? "High"
          : productivityRate < 75
            ? "Medium"
            : "Low";

      const aiRecommendation =
        productivityRate < 40
          ? "Increase manpower immediately and review execution strategy."
          : productivityRate < 60
            ? "Add workers or overtime to avoid schedule delay."
            : productivityRate < 75
              ? "Monitor worker performance and optimize workflow."
              : "Current productivity is healthy.";

      const existingRecord = await Productivity.findOne({
        task: task._id,
      });

      if (!existingRecord) {
        await Productivity.create({
          project: task.project?._id || task.project,
          task: task._id,
          workItem: task.title,
          date: new Date(),
          workers: task.assignedWorkers.length || totalWorkers,
          attendance: verifiedWorkers,
          plannedOutput: planned,
          actualOutput: actual,
          unit: unit || "task",
          remarks:
            remarks ||
            "Automatically recorded after all workers were verified.",
          productivityHealth,
          delayRisk,
          aiRecommendation,
          createdBy: req.user._id,
        });

        task.productivityRecorded = true;
        await task.save();

        if (productivityRate < 60) {
          const admins = await User.find({ role: "admin" }).select("_id");

          await Notification.insertMany(
            admins.map((admin) => ({
              user: admin._id,
              title: "⚠ Low Productivity Alert",
              message: `${task.title} productivity is ${productivityRate}% in ${
                task.project?.name || "Project"
              }. ${aiRecommendation}`,
              type: "low_productivity",
            })),
          );
        }
      }
    }

    await recalculateProjectProgress(task.project?._id || task.project);

    res.json({
      message:
        allWorkersVerified && taskFullyCompleted
          ? "Work verified. Task completed and productivity recorded."
          : "Worker work verified. Waiting for other workers to be verified.",
      task,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
