const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { crud } = require("./controllers/crudController");

const manpowerRoutes = require("./routes/manpowerRoutes");
const manpowerAttendanceRoutes = require("./routes/manpowerAttendanceRoutes");
const workerRoutes = require("./routes/workerRoutes");
const manpowerRequestRoutes = require("./routes/manpowerRequestRoutes");
const materialRoutes = require("./routes/materialRoutes");

const manpowerRequestController = require("./controllers/manpowerRequestController");
const manpowerPlanRoutes = require("./routes/manpowerPlanRoutes");
const productivityRoutes = require("./routes/productivityRoutes");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public")));

// API routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/reports", require("./routes/dailyReportRoutes"));

app.use("/api/materials", materialRoutes);
app.use("/api/material-requests", require("./routes/materialRequestRoutes"));

app.use("/api/manpower", manpowerRoutes);
app.use("/api/manpower-attendance", manpowerAttendanceRoutes);
app.use("/api/manpower-requests", manpowerRequestRoutes);
app.use("/api/manpower-plans", manpowerPlanRoutes);
app.use("/api/workers", workerRoutes);

app.use("/api/expenses", require("./routes/expenseRoutes"));
app.use("/api/expense-requests", require("./routes/expenseRequestRoutes"));

app.use(
  "/api/equipment",
  require("./routes/crudRoutes")(
    crud(require("./models/Equipment"), {
      populate: "assignedProject",
    }),
  ),
);

app.use("/api/equipment-requests", require("./routes/equipmentRequestRoutes"));

const Issue = require("./models/Issue");
const Notification = require("./models/Notification");
const User = require("./models/User");
const { protect } = require("./middleware/authMiddleware");

app.get("/api/issues", protect, async (req, res) => {
  const issues = await Issue.find()
    .populate("project reportedBy")
    .sort({ createdAt: -1 });

  res.json(issues);
});

app.post("/api/issues", protect, async (req, res) => {
  try {
    const issue = await Issue.create({
      ...req.body,
      reportedBy: req.user._id,
    });

    const admins = await User.find({ role: "admin" });

    if (admins.length > 0) {
      await Notification.insertMany(
        admins.map((admin) => ({
          user: admin._id,
          title: "New Issue/Risk Filed",
          message: `${req.user.name} filed an issue/risk: ${issue.title}`,
          type: "issue_risk",
        })),
      );
    }

    const populatedIssue = await Issue.findById(issue._id).populate(
      "project reportedBy",
    );

    res.status(201).json(populatedIssue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put("/api/issues/:id", protect, async (req, res) => {
  try {
    const oldIssue = await Issue.findById(req.params.id).populate("reportedBy");

    const issue = await Issue.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate("project reportedBy");

    if (!issue) {
      return res.status(404).json({ message: "Issue/Risk not found" });
    }

    if (
      req.body.status === "Resolved" &&
      oldIssue?.status !== "Resolved" &&
      issue.reportedBy?._id
    ) {
      await Notification.create({
        user: issue.reportedBy._id,
        title: "Issue/Risk Resolved",
        message: `Your issue/risk "${issue.title}" has been acknowledged as solved by admin.`,
        type: "issue_risk",
      });
    }

    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete("/api/issues/:id", protect, async (req, res) => {
  await Issue.findByIdAndDelete(req.params.id);
  res.json({ message: "Issue/Risk deleted" });
});

app.use("/api/export", require("./routes/exportRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/productivity", productivityRoutes);
app.use("/api/supply-requests", require("./routes/supplyRequestRoutes"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use(notFound);
app.use(errorHandler);

// Auto-release expired manpower assignments
manpowerRequestController
  .releaseExpiredAssignments()
  .then((count) => {
    if (count > 0) {
      console.log(`Released ${count} expired manpower assignment(s).`);
    }
  })
  .catch((err) => console.error("Auto-release error:", err.message));

setInterval(
  () => {
    manpowerRequestController
      .releaseExpiredAssignments()
      .then((count) => {
        if (count > 0) {
          console.log(`Released ${count} expired manpower assignment(s).`);
        }
      })
      .catch((err) => console.error("Auto-release error:", err.message));
  },
  1000 * 60 * 60,
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
