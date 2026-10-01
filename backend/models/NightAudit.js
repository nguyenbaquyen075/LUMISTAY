const mongoose = require('mongoose');

// End-of-day close ("chốt ngày"): snapshot of one business date.
const nightAuditSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // YYYY-MM-DD
  runAt: { type: Date, default: Date.now },
  runBy: String,
  noShows: { type: Number, default: 0 },
  inHouse: { type: Number, default: 0 },
  figures: {
    sold: Number, available: Number, occupancy: Number, adr: Number, revpar: Number,
    roomRevenue: Number, serviceRevenue: Number, foodRevenue: Number, totalRevenue: Number
  },
  payments: { type: Map, of: Number, default: {} }       // method -> net amount taken that day
});

module.exports = mongoose.model('NightAudit', nightAuditSchema);
