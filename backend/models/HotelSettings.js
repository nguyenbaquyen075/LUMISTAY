const mongoose = require('mongoose');

// Singleton (key: 'main')
const settingsSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  name: { type: String, default: 'LumiStay Hanoi Luxury Hotel' },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  taxCode: { type: String, default: '' },
  checkInTime: { type: String, default: '14:00' },
  checkOutTime: { type: String, default: '12:00' },
  vatRate: { type: Number, default: 10 },
  serviceChargeRate: { type: Number, default: 5 },
  weekendSurchargePercent: { type: Number, default: 0 }, // Friday & Saturday nights
  earlyCheckInFeePercent: { type: Number, default: 50 }, // of one night's rate
  lateCheckOutFeePercent: { type: Number, default: 50 },
  seasons: [{
    name: String,
    from: Date,
    to: Date,
    adjustPercent: Number
  }],
  commissions: { type: Map, of: Number, default: {} },   // source key -> commission %
  bank: {
    bankCode: { type: String, default: '' },             // e.g. VCB, MB (VietQR code)
    accountNo: { type: String, default: '' },
    accountName: { type: String, default: '' }
  }
});

settingsSchema.statics.get = function () {
  return this.findOneAndUpdate({ key: 'main' }, { $setOnInsert: { key: 'main' } }, { upsert: true, returnDocument: 'after' });
};

module.exports = mongoose.model('HotelSettings', settingsSchema);
