const Task = require("../models/Task");
const Project = require("../models/Project");

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
    return {
      assignedTo: user._id,
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
    const filter = await taskFilter(req.user);

    if (req.query.project) {
      filter.project = req.query.project;
    }

    const tasks = await Task.find(filter)
      .populate("project", "name")
      .populate("assignedTo", "name email role")
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
    const task = await Task.create({
      ...req.body,
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
    task.assignedTo = req.body.assignedTo || task.assignedTo;
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
        status: Number(progress) >= 100 ? "Completed" : status || "In Progress",
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
    const completedTasks = tasks.filter((t) => t.status === "Completed").length;

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
