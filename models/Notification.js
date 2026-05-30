const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: [
        "material_request",
        "equipment_request",
        "manpower_request",
        "worker_assigned",
        "task_verification",
        "approved",
        "rejected",
        "out_for_delivery",
        "received",
        "returned",
        "productivity",
        "low_productivity",
        "worker_unassigned",
        "daily_report",
      ],
      default: "material_request",
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Notification", notificationSchema);
