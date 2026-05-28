const ExpenseRequest = require("../models/ExpenseRequest");
const Expense = require("../models/Expense");
const Project = require("../models/Project");

const Notification = require("../models/Notification");

const projectFilter = async (user) => {
  if (["admin", "inventory"].includes(user.role)) {
    return {};
  }

  if (user.role === "staff") {
    const projects = await Project.find({
      assignedStaff: user._id,
    }).select("_id");

    return {
      project: { $in: projects.map((p) => p._id) },
    };
  }

  return {};
};

const adminOrInventoryOnly = (user) => {
  return ["admin", "inventory"].includes(user.role);
};

exports.getExpenseRequests = async (req, res) => {
  try {
    const filter = await projectFilter(req.user);

    if (req.query.project) {
      filter.project = req.query.project;
    }

    const requests = await ExpenseRequest.find(filter)
      .populate("project", "name location budget")
      .populate("requestedBy", "name email role")
      .populate("reviewedBy", "name email role")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load expense requests.",
      error: error.message,
    });
  }
};

async function getBudgetSummary(projectId) {
  const project = await Project.findById(projectId);

  const approvedRequests = await ExpenseRequest.find({
    project: projectId,
    status: { $in: ["Approved", "Paid"] },
  });

  const pendingRequests = await ExpenseRequest.find({
    project: projectId,
    status: "Pending",
  });

  const budget = Number(project?.budget || 0);

  const spent = approvedRequests.reduce(
    (sum, r) => sum + Number(r.amount || 0),
    0,
  );

  const pending = pendingRequests.reduce(
    (sum, r) => sum + Number(r.amount || 0),
    0,
  );

  const remaining = budget - spent;
  const usage = budget > 0 ? Number(((spent / budget) * 100).toFixed(2)) : 0;

  let status = "No Budget";

  if (budget > 0 && usage < 75) status = "Healthy";
  if (budget > 0 && usage >= 75 && usage < 100) status = "Warning";
  if (budget > 0 && usage >= 100) status = "Over Budget";

  return {
    budget,
    spent,
    pending,
    remaining,
    usage,
    status,
  };
}

exports.createExpenseRequest = async (req, res) => {
  try {
    if (req.user.role !== "staff") {
      return res.status(403).json({
        message: "Only project staff can request expenses.",
      });
    }

    const { project, category, description, amount, reason } = req.body;

    const assignedProject = await Project.findOne({
      _id: project,
      assignedStaff: req.user._id,
    });

    if (!assignedProject) {
      return res.status(403).json({
        message: "You can only request expenses for your assigned project.",
      });
    }

    const receipt = req.file ? `/uploads/expenses/${req.file.filename}` : "";

    const request = await ExpenseRequest.create({
      project,
      category,
      description,
      amount: Number(amount || 0),
      reason,
      receipt,
      requestedBy: req.user._id,
    });

    res.status(201).json({
      message: "Expense request submitted successfully.",
      request,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to submit expense request.",
      error: error.message,
    });
  }
};

exports.approveExpenseRequest = async (req, res) => {
  try {
    if (!adminOrInventoryOnly(req.user)) {
      return res.status(403).json({
        message: "Only admin or inventory can approve expense requests.",
      });
    }

    const request = await ExpenseRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        message: "Expense request not found.",
      });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({
        message: "Only pending requests can be approved.",
      });
    }

    const budgetSummary = await getBudgetSummary(request.project);

    if (
      budgetSummary.budget > 0 &&
      Number(request.amount || 0) > Number(budgetSummary.remaining || 0)
    ) {
      return res.status(400).json({
        message: `Cannot approve. This request exceeds remaining budget. Remaining: ₱${Number(
          budgetSummary.remaining,
        ).toLocaleString()}`,
      });
    }

    request.status = "Approved";
    request.adminRemarks = req.body.adminRemarks || "";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();

    await request.save();

    const expenseData = {
      project: request.project,
      date: new Date(),
      remarks: `${request.description}${
        request.reason ? ` | Reason: ${request.reason}` : ""
      }`,
      createdBy: request.requestedBy,
      approvedBy: req.user._id,
      expenseRequest: request._id,
      status: "From Request",
    };

    if (request.category === "Labor") {
      expenseData.laborCost = request.amount;
    } else if (request.category === "Materials") {
      expenseData.materialCost = request.amount;
    } else if (request.category === "Equipment") {
      expenseData.equipmentCost = request.amount;
    } else {
      expenseData.otherExpenses = request.amount;
    }

    expenseData.totalExpense =
      Number(expenseData.laborCost || 0) +
      Number(expenseData.materialCost || 0) +
      Number(expenseData.equipmentCost || 0) +
      Number(expenseData.otherExpenses || 0);

    const expense = await Expense.create(expenseData);

    await Notification.create({
      user: request.requestedBy,
      title: "Expense Request Approved",
      message: `Your expense request worth ₱${Number(request.amount || 0).toLocaleString()} has been approved.`,
    });

    res.json({
      message: "Expense request approved and recorded as expense.",
      request,
      expense,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to approve expense request.",
      error: error.message,
    });
  }
};

exports.rejectExpenseRequest = async (req, res) => {
  try {
    if (!adminOrInventoryOnly(req.user)) {
      return res.status(403).json({
        message: "Only admin or inventory can reject expense requests.",
      });
    }

    const request = await ExpenseRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        message: "Expense request not found.",
      });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({
        message: "Only pending requests can be rejected.",
      });
    }

    request.status = "Rejected";
    request.adminRemarks = req.body.adminRemarks || "Rejected";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();

    await request.save();

    await Notification.create({
      user: request.requestedBy,
      title: "Expense Request Rejected",
      message: `Your expense request worth ₱${Number(request.amount || 0).toLocaleString()} was rejected. Remarks: ${request.adminRemarks}`,
    });

    res.json({
      message: "Expense request rejected.",
      request,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to reject expense request.",
      error: error.message,
    });
  }
};

exports.markExpenseRequestPaid = async (req, res) => {
  try {
    if (!["admin", "inventory"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Only admin or inventory can mark expense requests as paid.",
      });
    }

    const request = await ExpenseRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        message: "Expense request not found.",
      });
    }

    if (request.status !== "Approved") {
      return res.status(400).json({
        message: "Only approved expense requests can be marked as paid.",
      });
    }

    request.status = "Paid";
    request.adminRemarks =
      req.body.adminRemarks || request.adminRemarks || "Paid";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();

    await request.save();

    await Notification.create({
      user: request.requestedBy,
      title: "Expense Request Paid",
      message: `Your approved expense request worth ₱${Number(request.amount || 0).toLocaleString()} has been marked as paid.`,
    });

    res.json({
      message: "Expense request marked as paid.",
      request,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to mark expense request as paid.",
      error: error.message,
    });
  }
};

exports.getExpenseBudgetSummary = async (req, res) => {
  try {
    const { projectId } = req.params;

    const summary = await getBudgetSummary(projectId);

    res.json(summary);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load budget summary.",
      error: error.message,
    });
  }
};

exports.getExpenseAnalytics = async (req, res) => {
  try {
    const filter = {};

    if (req.query.project) {
      filter.project = req.query.project;
    }

    const requests = await ExpenseRequest.find(filter)
      .populate("project", "name budget")
      .sort({ createdAt: -1 });

    const approvedPaid = requests.filter((r) =>
      ["Approved", "Paid"].includes(r.status),
    );

    const totalApproved = approvedPaid.reduce(
      (sum, r) => sum + Number(r.amount || 0),
      0,
    );

    const totalPaid = requests
      .filter((r) => r.status === "Paid")
      .reduce((sum, r) => sum + Number(r.amount || 0), 0);

    const totalPending = requests
      .filter((r) => r.status === "Pending")
      .reduce((sum, r) => sum + Number(r.amount || 0), 0);

    const byCategory = {};
    const byStatus = {};
    const byProject = {};
    const monthly = {};

    requests.forEach((r) => {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;

      if (["Approved", "Paid"].includes(r.status)) {
        byCategory[r.category] =
          (byCategory[r.category] || 0) + Number(r.amount || 0);

        const projectName = r.project?.name || "No Project";
        byProject[projectName] =
          (byProject[projectName] || 0) + Number(r.amount || 0);

        const month = new Date(r.createdAt).toLocaleString("en-US", {
          month: "short",
          year: "numeric",
        });

        monthly[month] = (monthly[month] || 0) + Number(r.amount || 0);
      }
    });

    const projectBudget = requests[0]?.project?.budget || 0;
    const remainingBudget = Number(projectBudget || 0) - totalApproved;
    const usage =
      projectBudget > 0
        ? Number(((totalApproved / projectBudget) * 100).toFixed(2))
        : 0;

    res.json({
      totalRequests: requests.length,
      totalApproved,
      totalPaid,
      totalPending,
      projectBudget,
      remainingBudget,
      usage,

      byCategory: Object.entries(byCategory).map(([name, value]) => ({
        name,
        value,
      })),

      byStatus: Object.entries(byStatus).map(([name, value]) => ({
        name,
        value,
      })),

      byProject: Object.entries(byProject).map(([name, value]) => ({
        name,
        value,
      })),

      monthly: Object.entries(monthly).map(([name, value]) => ({
        name,
        value,
      })),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load expense analytics.",
      error: error.message,
    });
  }
};
