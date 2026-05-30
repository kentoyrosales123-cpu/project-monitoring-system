const mongoose = require("mongoose");

const workerSchema = new mongoose.Schema(
  {
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
      required: true,
    },

    workerName: {
      type: String,
      required: true,
    },

    position: {
      type: String,
      enum: [
        "Foreman",
        "Mason",
        "Carpenter",
        "Steelman",
        "Electrician",
        "Plumber",
        "Helper",
        "Engineer",
        "Operator",
      ],
      required: true,
    },

    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "Half Day", "Leave"],
      default: "Present",
    },

    overtimeHours: {
      type: Number,
      default: 0,
    },

    ratePerDay: {
      type: Number,
      default: 0,
    },

    remarks: {
      type: String,
      default: "",
    },
  },
  { _id: false },
);

const manpowerAttendanceSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    date: { type: Date, required: true },
    workers: [workerSchema],
    totalPresent: { type: Number, default: 0 },
    totalAbsent: { type: Number, default: 0 },
    totalLate: { type: Number, default: 0 },
    totalOvertimeHours: { type: Number, default: 0 },
    totalLaborCost: { type: Number, default: 0 },
    remarks: { type: String, default: "" },
    encodedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ManpowerAttendance", manpowerAttendanceSchema);
