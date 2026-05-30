const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    startDate: {
      type: Date,
      required: true,
    },

    dueDate: {
      type: Date,
      required: true,
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },

    status: {
      type: String,
      enum: ["Pending", "Ongoing", "For Verification", "Done", "Delayed"],
      default: "Pending",
    },

    // NEW
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    remarks: {
      type: String,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedWorkers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Worker",
      },
    ],
    workerConfirmations: [
      {
        worker: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Worker",
        },
        status: {
          type: String,
          enum: ["Pending", "Submitted", "Verified"],
          default: "Pending",
        },
        confirmedAt: {
          type: Date,
        },
      },
    ],

    workerStatus: {
      type: String,
      enum: ["Pending", "In Progress", "For Verification", "Verified"],
      default: "Pending",
    },

    workerConfirmedAt: {
      type: Date,
    },

    productivityRecorded: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Task", taskSchema);
