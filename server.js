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
app.use(express.static(path.join(__dirname, "public")));

const materialRoutes = require("./routes/materialRoutes");

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/reports", require("./routes/dailyReportRoutes"));
app.use("/api/materials", materialRoutes);

app.use("/api/expenses", require("./routes/expenseRoutes"));

app.use("/api/manpower", require("./routes/manpowerRoutes"));

app.use(
  "/api/equipment",
  require("./routes/crudRoutes")(
    crud(require("./models/Equipment"), { populate: "project" }),
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

app.get("*", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html")),
);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
