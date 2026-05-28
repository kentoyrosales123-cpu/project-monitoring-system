const mongoose = require("mongoose");

const productivitySchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    date: { type: Date, required: true },
    activity: { type: String, required: true },
    plannedWorkers: { type: Number, default: 0 },
    actualWorkers: { type: Number, default: 0 },
    outputQuantity: { type: Number, default: 0 },
    unit: { type: String, default: "" },
    remarks: { type: String, default: "" },
    encodedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

productivitySchema.virtual("productivityRate").get(function () {
  if (!this.actualWorkers) return 0;
  return this.outputQuantity / this.actualWorkers;
});

module.exports = mongoose.model("Productivity", productivitySchema);
