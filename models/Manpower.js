const mongoose = require('mongoose');

const manpowerSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  date: { type: Date, required: true },
  skilledWorkers: { type: Number, default: 0 },
  helpers: { type: Number, default: 0 },
  engineers: { type: Number, default: 0 },
  operators: { type: Number, default: 0 },
}, { timestamps: true });

manpowerSchema.virtual('totalManpower').get(function() {
  return this.skilledWorkers + this.helpers + this.engineers + this.operators;
});
manpowerSchema.set('toJSON', { virtuals: true });
manpowerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Manpower', manpowerSchema);
