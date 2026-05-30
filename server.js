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

app.use(
  "/api/issues",
  require("./routes/crudRoutes")(
    crud(require("./models/Issue"), {
      populate: "project reportedBy",
      attachUser: "reportedBy",
    }),
  ),
);

app.use("/api/export", require("./routes/exportRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/productivity", productivityRoutes);

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
