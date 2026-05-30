const Project = require("../models/Project");
const Expense = require("../models/Expense");
const DailyReport = require("../models/DailyReport");
const Manpower = require("../models/Manpower");
const Equipment = require("../models/Equipment");
const Worker = require("../models/Worker");
const Task = require("../models/Task");

const projectFilter = (user) => {
  if (["admin", "inventory"].includes(user.role)) {
    return {};
  }

  if (user.role === "staff") {
    return {
      assignedStaff: user._id,
    };
  }

  if (user.role === "client") {
    return {
      clientUser: user._id,
    };
  }

  return {};
};

exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find(projectFilter(req.user))
      .populate("assignedStaff", "name email role")
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const project = await Project.create({
      ...req.body,
      budget: Number(req.body.budget || 0),
      progress: Number(req.body.progress || 0),
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        budget: Number(req.body.budget || 0),
        progress: Number(req.body.progress || 0),
      },
      { new: true, runValidators: true },
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProgress = async (req, res) => {
  try {
    const { progress, status } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    const isAdmin = req.user.role === "admin";
    const isAssignedStaff = project.assignedStaff.some(
      (staffId) => String(staffId) === String(req.user._id),
    );

    if (!isAdmin && !isAssignedStaff) {
      return res.status(403).json({
        message: "Only admin or assigned staff can update project progress.",
      });
    }

    const newProgress = Math.min(100, Math.max(0, Number(progress || 0)));

    project.progress = newProgress;

    if (status) {
      project.status = status;
    }

    if (newProgress === 100) {
      project.status = "Completed";
    }

    await project.save();

    res.json({
      message: "Project progress updated.",
      project,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    res.json({ message: "Project deleted." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.dashboardStats = async (req, res) => {
  try {
    const filter = projectFilter(req.user);
    const projects = await Project.find(filter);
    const projectIds = projects.map((p) => p._id);

    const expenses = await Expense.find({
      project: { $in: projectIds },
    });

    const reports = await DailyReport.find({
      project: { $in: projectIds },
    })
      .populate("project", "name")
      .populate("submittedBy", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    const equipment = await Equipment.find({
      project: { $in: projectIds },
    });

    const totalExpenses = expenses.reduce((sum, e) => {
      return (
        sum +
        Number(e.laborCost || 0) +
        Number(e.materialCost || 0) +
        Number(e.equipmentCost || 0) +
        Number(e.otherExpenses || 0)
      );
    }, 0);

    const totalBudget = projects.reduce(
      (sum, p) => sum + Number(p.budget || 0),
      0,
    );

    const budgetRemaining = totalBudget - totalExpenses;
    const budgetUsage =
      totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0;

    const expenseByProject = {};

    expenses.forEach((e) => {
      const projectId = String(e.project);
      const total =
        Number(e.laborCost || 0) +
        Number(e.materialCost || 0) +
        Number(e.equipmentCost || 0) +
        Number(e.otherExpenses || 0);

      expenseByProject[projectId] = (expenseByProject[projectId] || 0) + total;
    });

    const budgetMonitoring = projects.map((p) => {
      const projectExpense = expenseByProject[String(p._id)] || 0;
      const projectBudget = Number(p.budget || 0);
      const remaining = projectBudget - projectExpense;
      const usage =
        projectBudget > 0
          ? Math.round((projectExpense / projectBudget) * 100)
          : 0;

      let budgetStatus = "No Budget";

      if (projectBudget > 0 && usage < 75) budgetStatus = "Healthy";
      if (projectBudget > 0 && usage >= 75 && usage < 100)
        budgetStatus = "Warning";
      if (projectBudget > 0 && usage >= 100) budgetStatus = "Over Budget";

      return {
        id: p._id,
        name: p.name,
        budget: projectBudget,
        expenses: projectExpense,
        remaining,
        usage,
        status: budgetStatus,
      };
    });

    const overBudgetProjects = budgetMonitoring.filter(
      (p) => p.status === "Over Budget",
    );

    const now = new Date();

    const delayedProjects = projects.filter(
      (p) =>
        p.status === "Delayed" ||
        (Number(p.progress || 0) < 100 &&
          new Date(p.targetCompletionDate) < now),
    );

    const plannedProjects = projects.filter(
      (p) => p.status === "Planned",
    ).length;

    const ongoingProjects = projects.filter(
      (p) => p.status === "Ongoing",
    ).length;

    const completedProjects = projects.filter(
      (p) => p.status === "Completed",
    ).length;

    const workers = await Worker.find({
      assignedProject: { $in: projectIds },
    });

    const totalSkilledWorkers = workers.filter(
      (w) => w.position === "Skilled",
    ).length;

    const totalHelpers = workers.filter((w) => w.position === "Helper").length;

    const totalEngineers = workers.filter(
      (w) => w.position === "Engineer",
    ).length;

    const totalOperators = workers.filter(
      (w) => w.position === "Operator",
    ).length;

    const totalManpower = workers.length;

    const progressSummary = projects.map((p) => ({
      id: p._id,
      name: p.name,
      progress: p.progress,
      status: p.status,
      clientName: p.clientName,
      location: p.location,
      budget: p.budget,
      targetCompletionDate: p.targetCompletionDate,
    }));

    res.json({
      totalProjects: projects.length,
      plannedProjects,
      ongoingProjects,
      completedProjects,
      delayedProjects: delayedProjects.length,

      totalExpenses,
      totalBudget,
      budgetRemaining,
      budgetUsage,
      budgetMonitoring,
      totalSkilledWorkers,
      totalHelpers,
      totalEngineers,
      totalOperators,
      overBudgetProjects: overBudgetProjects.length,

      totalManpower,
      totalEquipment: equipment.length,
      recentReports: reports,

      delayedProjectList: delayedProjects.map((p) => ({
        name: p.name,
        progress: p.progress,
        dueDate: p.targetCompletionDate,
      })),

      progressSummary,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyProjects = async (req, res) => {
  try {
    let projects;

    if (req.user.role === "staff") {
      const assignedTasks = await Task.find({
        assignedTo: req.user._id,
      }).select("project");

      const taskProjectIds = assignedTasks.map((t) => t.project);

      projects = await Project.find({
        $or: [
          { assignedStaff: req.user._id },
          { _id: { $in: taskProjectIds } },
        ],
      })
        .populate("assignedStaff", "name email role")
        .sort({ createdAt: -1 });
    } else if (req.user.role === "client") {
      projects = await Project.find({
        clientUser: req.user._id,
      })
        .populate("assignedStaff", "name email role")
        .sort({ createdAt: -1 });
    } else {
      projects = await Project.find()
        .populate("assignedStaff", "name email role")
        .sort({ createdAt: -1 });
    }

    res.json(projects);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load projects",
      error: error.message,
    });
  }
};
