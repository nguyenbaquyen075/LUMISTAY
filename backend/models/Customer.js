const mongoose = require('mongoose');

// Contact/ID details per guest, keyed by email. Stay stats are derived from bookings.
const customerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  idNumber: { type: String, default: '' }, // CCCD / passport
  nationality: { type: String, default: 'Việt Nam' },
  notes: { type: String, default: '' },
  dob: Date,
  vipLevel: { type: String, enum: ['none', 'silver', 'gold', 'platinum'], default: 'none' },
  preferences: { type: String, default: '' },
  marketingConsent: { type: Boolean, default: false },
  blacklisted: { type: Boolean, default: false },
  blacklistReason: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Customer', customerSchema);
