const mongoose = require("mongoose");

const manpowerRequestSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
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
    quantityNeeded: { type: Number, required: true },
    neededDate: { type: Date, required: true },
    reason: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Assigned", "Completed"],
      default: "Pending",
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedWorkers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Worker",
      },
    ],
    assignmentStartDate: {
      type: Date,
      required: true,
    },

    assignmentEndDate: {
      type: Date,
      required: true,
    },

    assignmentReleasedAt: {
      type: Date,
      default: null,
    },
    adminRemarks: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ManpowerRequest", manpowerRequestSchema);
