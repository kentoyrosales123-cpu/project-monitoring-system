const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    clientName: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    targetCompletionDate: { type: Date, required: true },
    budget: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ["Planned", "Ongoing", "Delayed", "Completed"],
      default: "Planned",
    },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    assignedStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    clientUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    description: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Project", projectSchema);
