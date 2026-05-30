const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },

    materialName: { type: String, required: true },
    category: {
      type: String,
      default: "",
    },

    reorderLevel: {
      type: Number,
      default: 0,
    },

    unitCost: {
      type: Number,
      default: 0,
    },
    quantityDelivered: { type: Number, default: 0 },
    quantityUsed: { type: Number, default: 0 },
    unit: { type: String, required: true },
    supplier: { type: String, default: "" },
    deliveryDate: { type: Date, required: true },

    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Out for Delivery",
        "Delivered",
        "Rejected",
      ],
      default: "Pending",
    },

    received: {
      type: Boolean,
      default: false,
    },

    receivedAt: {
      type: Date,
      default: null,
    },
    inventoryOnHand: {
      type: Number,
      default: 0,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastUpdatedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

materialSchema.virtual("remainingQuantity").get(function () {
  return this.quantityDelivered - this.quantityUsed;
});

materialSchema.set("toJSON", { virtuals: true });
materialSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Material", materialSchema);
