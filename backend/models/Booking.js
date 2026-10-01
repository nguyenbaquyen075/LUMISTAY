const mongoose = require('mongoose');

const CHARGE_CATEGORIES = ['service', 'food', 'minibar', 'laundry', 'spa', 'transport', 'fee', 'other'];
const SOURCES = ['website', 'booking_com', 'agoda', 'expedia', 'traveloka', 'airbnb', 'walk_in', 'phone', 'corporate', 'other'];
const METHODS = ['cash', 'card', 'transfer', 'online'];

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  // Booked by room type; the physical room is assigned later (at the latest on check-in)
  roomType: { type: String, required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: false },
  ratePlan: { type: mongoose.Schema.Types.ObjectId, ref: 'RatePlan' },
  ratePlanName: { type: String, default: '' },
  policy: { // snapshot of the rate plan's rules at booking time
    nonRefundable: { type: Boolean, default: false },
    freeCancelHours: { type: Number, default: 48 },
    penaltyNights: { type: Number, default: 1 },
    depositPercent: { type: Number, default: 0 }
  },
  guestInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    idNumber: { type: String, default: '' },
    nationality: { type: String, default: 'Việt Nam' },
    note: { type: String, default: '' }
  },
  // Everyone staying (for temporary-residence registration)
  occupants: [{
    name: String,
    gender: { type: String, enum: ['', 'male', 'female', 'other'], default: '' },
    dob: Date,
    idType: { type: String, enum: ['cccd', 'passport'], default: 'cccd' },
    idNumber: String,
    nationality: { type: String, default: 'Việt Nam' },
    visaExpiry: Date,
    entryDate: Date
  }],
  residence: {
    registered: { type: Boolean, default: false },
    at: Date,
    by: String
  },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  guests: {
    adults: { type: Number, required: true, min: 1, default: 1 },
    children: { type: Number, default: 0 }
  },
  nights: { type: Number, required: true },
  nightlyRates: [{ type: Number }],      // rate for each night, before discount
  pricePerNight: { type: Number, required: true }, // average, for display
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  discountReason: { type: String, default: '' },
  totalPrice: { type: Number, required: true },    // room total after discount, before tax
  vatRate: { type: Number, default: 0 },
  serviceChargeRate: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'],
    default: 'pending'
  },
  paymentStatus: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
  paymentMethod: { type: String, enum: METHODS, default: 'cash' },
  specialRequests: [{ type: String }],
  source: { type: String, enum: SOURCES, default: 'website' },
  commissionPercent: { type: Number, default: 0 },
  actualCheckIn: Date,
  actualCheckOut: Date,
  cancellation: { at: Date, by: String, fee: Number, waived: Boolean },
  // Extra charges on top of the room price (spa, minibar, restaurant, fees...)
  charges: [{
    label: { type: String, required: true },
    category: { type: String, enum: CHARGE_CATEGORIES, default: 'service' },
    amount: { type: Number, required: true, min: 0 },
    at: { type: Date, default: Date.now },
    by: String
  }],
  payments: [{
    type: { type: String, enum: ['payment', 'refund'], default: 'payment' },
    purpose: { type: String, enum: ['deposit', 'settlement'], default: 'settlement' },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: METHODS, default: 'cash' },
    at: { type: Date, default: Date.now },
    by: String,
    shift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' }
  }],
  history: [{
    action: String,
    by: String,
    at: { type: Date, default: Date.now }
  }],
  bookingCode: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

bookingSchema.pre('save', function() {
  if (!this.bookingCode) {
    this.bookingCode = 'LS' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  this.updatedAt = Date.now();
});

bookingSchema.index({ room: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ roomType: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ 'guestInfo.email': 1 });

module.exports = mongoose.model('Booking', bookingSchema);
module.exports.CHARGE_CATEGORIES = CHARGE_CATEGORIES;
module.exports.SOURCES = SOURCES;
module.exports.METHODS = METHODS;
