const mongoose = require("mongoose");

const manpowerPlanSchema = new mongoose.Schema(
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
    activity: {
      type: String,
      required: true,
      trim: true,
    },
    skilledWorkers: { type: Number, default: 0 },
    helpers: { type: Number, default: 0 },
    engineers: { type: Number, default: 0 },
    operators: { type: Number, default: 0 },
    remarks: { type: String, default: "" },
    encodedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ManpowerPlan", manpowerPlanSchema);
