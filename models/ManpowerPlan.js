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

    foreman: { type: Number, default: 0 },
    mason: { type: Number, default: 0 },
    carpenter: { type: Number, default: 0 },
    steelman: { type: Number, default: 0 },
    electrician: { type: Number, default: 0 },
    plumber: { type: Number, default: 0 },

    helpers: { type: Number, default: 0 },
    engineers: { type: Number, default: 0 },
    operators: { type: Number, default: 0 },

    remarks: {
      type: String,
      default: "",
    },

    encodedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ManpowerPlan", manpowerPlanSchema);
