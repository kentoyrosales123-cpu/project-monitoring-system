const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { crud } = require("./controllers/crudController");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public")));

const materialRoutes = require("./routes/materialRoutes");

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/reports", require("./routes/dailyReportRoutes"));
app.use("/api/materials", materialRoutes);

app.use("/api/expenses", require("./routes/expenseRoutes"));

app.use("/api/manpower", require("./routes/manpowerRoutes"));

app.use("/api/expense-requests", require("./routes/expenseRequestRoutes"));

app.use(
  "/api/equipment",
  require("./routes/crudRoutes")(
    crud(require("./models/Equipment"), {
      populate: "assignedProject",
    }),
  ),
);

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

app.use("/api/material-requests", require("./routes/materialRequestRoutes"));
app.use("/api/equipment-requests", require("./routes/equipmentRequestRoutes"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
