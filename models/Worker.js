const mongoose = require("mongoose");

const workerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    position: {
      type: String,
      enum: ["Skilled", "Helper", "Engineer", "Operator"],
      required: true,
    },
    contactNumber: { type: String, default: "" },
    ratePerDay: { type: Number, default: 0 },
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
    remarks: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Worker", workerSchema);
