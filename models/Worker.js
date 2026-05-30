const mongoose = require("mongoose");

const attendanceHistorySchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "Half Day", "Leave"],
      required: true,
    },

    overtimeHours: {
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

const workerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
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

    contactNumber: {
      type: String,
      default: "",
    },

    ratePerDay: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Available", "Assigned", "Inactive", "On Leave"],
      default: "Available",
    },

    assignedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },

    attendanceHistory: [attendanceHistorySchema],

    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Worker", workerSchema);
