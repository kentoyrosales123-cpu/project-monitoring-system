const mongoose = require("mongoose");

const productivitySchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },

    workItem: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    workers: {
      type: Number,
      required: true,
      default: 0,
    },

    attendance: {
      type: Number,
      default: 0,
    },

    plannedOutput: {
      type: Number,
      required: true,
      default: 0,
    },

    actualOutput: {
      type: Number,
      required: true,
      default: 0,
    },

    unit: {
      type: String,
      required: true,
      trim: true,
      default: "units",
    },

    remarks: {
      type: String,
      default: "",
    },

    productivityHealth: {
      type: String,
      enum: ["Excellent", "Good", "Average", "Poor", "Critical"],
      default: "Average",
    },

    delayRisk: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },

    aiRecommendation: {
      type: String,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

productivitySchema.virtual("productivityRate").get(function () {
  if (!this.plannedOutput || this.plannedOutput <= 0) return 0;

  return Number(((this.actualOutput / this.plannedOutput) * 100).toFixed(2));
});

productivitySchema.set("toJSON", {
  virtuals: true,
});

productivitySchema.set("toObject", {
  virtuals: true,
});

module.exports = mongoose.model("Productivity", productivitySchema);
