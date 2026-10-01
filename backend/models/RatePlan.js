const mongoose = require('mongoose');

// A way of selling a room type: price modifier + cancellation rules.
const ratePlanSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  adjustPercent: { type: Number, default: 0 },         // -10 = 10% cheaper than the standard rate
  breakfast: { type: Boolean, default: false },
  nonRefundable: { type: Boolean, default: false },    // cancelling costs the whole stay
  freeCancelHours: { type: Number, default: 48 },      // free cancellation until N hours before check-in time
  penaltyNights: { type: Number, default: 1 },         // otherwise this many nights are charged
  depositPercent: { type: Number, default: 0 },        // deposit asked at booking
  minStay: { type: Number, default: 1 },
  isPublic: { type: Boolean, default: true },          // false = staff only (corporate, ...)
  isDefault: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  roomTypes: [{ type: String }]                        // empty = all room types
});

module.exports = mongoose.model('RatePlan', ratePlanSchema);
