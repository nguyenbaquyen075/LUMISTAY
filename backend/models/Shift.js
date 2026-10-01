const mongoose = require('mongoose');

// Cashier shift ("ca thu ngân"): cash taken between open and close is reconciled at close.
const shiftSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: String,
  openedAt: { type: Date, default: Date.now },
  openingCash: { type: Number, default: 0, min: 0 },
  closedAt: Date,
  expectedCash: Number,
  countedCash: Number,
  variance: Number,       // counted - expected
  note: { type: String, default: '' },
  status: { type: String, enum: ['open', 'closed'], default: 'open' }
});

module.exports = mongoose.model('Shift', shiftSchema);
