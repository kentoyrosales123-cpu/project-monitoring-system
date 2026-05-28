const mongoose = require("mongoose");

const equipmentRequestSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipment",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    purpose: {
      type: String,
      default: "",
    },

    projectLocation: {
      type: String,
      default: "",
    },

    expectedReturnDate: {
      type: Date,
    },

    returnCondition: {
      type: String,
      enum: ["Good", "Minor Damage", "Damaged", "Lost"],
      default: "Good",
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Rejected",
        "Out for Delivery",
        "In Use",
        "Return Requested",
        "Returned",
      ],
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

    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reviewedAt: Date,
    deliveredAt: Date,
    receivedAt: Date,
    returnedAt: Date,
  },

  { timestamps: true },
);

module.exports = mongoose.model("EquipmentRequest", equipmentRequestSchema);
