const mongoose = require("mongoose");

const supplyRequestSchema = new mongoose.Schema(
  {
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: true,
    },

    materialName: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      default: "",
    },

    unit: {
      type: String,
      default: "",
    },

    currentQty: {
      type: Number,
      default: 0,
    },

    reorderLevel: {
      type: Number,
      default: 0,
    },

    requestedQty: {
      type: Number,
      required: true,
    },

    reason: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SupplyRequest", supplyRequestSchema);
