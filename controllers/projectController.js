const Project = require("../models/Project");
const Expense = require("../models/Expense");
const DailyReport = require("../models/DailyReport");
const Manpower = require("../models/Manpower");
const Equipment = require("../models/Equipment");

const projectFilter = (user) =>
  user.role === "admin" ? {} : { assignedStaff: user._id };

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

    const manpower = await Manpower.find({
      project: { $in: projectIds },
    });

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

    const totalSkilledWorkers = manpower.reduce(
      (sum, m) => sum + Number(m.skilledWorkers || 0),
      0,
    );

    const totalHelpers = manpower.reduce(
      (sum, m) => sum + Number(m.helpers || 0),
      0,
    );

    const totalEngineers = manpower.reduce(
      (sum, m) => sum + Number(m.engineers || 0),
      0,
    );

    const totalOperators = manpower.reduce(
      (sum, m) => sum + Number(m.operators || 0),
      0,
    );

    const totalManpower =
      totalSkilledWorkers + totalHelpers + totalEngineers + totalOperators;

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
