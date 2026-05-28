const mongoose = require("mongoose");

const equipmentSchema = new mongoose.Schema(
  {
    equipmentName: {
      type: String,
      required: true,
      trim: true,
    },

    equipmentType: {
      type: String,
      enum: ["Small", "Heavy"],
      required: true,
      default: "Small",
    },

    // For small equipment
    totalQuantity: {
      type: Number,
      default: 0,
    },

    availableQuantity: {
      type: Number,
      default: 0,
    },

    borrowedQuantity: {
      type: Number,
      default: 0,
    },

    // For heavy equipment
    assetCode: {
      type: String,
      trim: true,
      default: "",
    },

    plateNumber: {
      type: String,
      trim: true,
      default: "",
    },

    assignedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },

    operatorName: {
      type: String,
      default: "",
    },

    currentLocation: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Available", "Assigned", "In Use", "Maintenance", "Damaged"],
      default: "Available",
    },

    condition: {
      type: String,
      enum: ["Good", "Maintenance", "Damaged"],
      default: "Good",
    },

    warehouseLocation: {
      type: String,
      default: "",
    },

    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Equipment", equipmentSchema);
