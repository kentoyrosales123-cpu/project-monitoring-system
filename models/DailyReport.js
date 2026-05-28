const mongoose = require("mongoose");

const dailyReportSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    reportDate: {
      type: Date,
      required: true,
    },

    weatherCondition: {
      type: String,
      required: true,
    },

    workAccomplished: {
      type: String,
      required: true,
    },

    manpower: [
      {
        position: String,
        quantity: Number,
      },
    ],

    equipmentUsed: [
      {
        equipmentName: String,
        quantity: Number,
        remarks: String,
      },
    ],

    materialsUsed: [
      {
        materialName: String,
        quantity: Number,
        unit: String,
      },
    ],

    issuesEncountered: {
      type: String,
      default: "",
    },

    safetyIncidents: {
      type: String,
      default: "",
    },

    remarks: {
      type: String,
      default: "",
    },

    photos: [String],

    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Needs Revision"],
      default: "Pending",
    },

    adminComments: {
      type: String,
      default: "",
    },

    isConfirmed: {
      type: Boolean,
      default: false,
    },

    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    confirmedAt: Date,

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reviewedAt: Date,

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("DailyReport", dailyReportSchema);
