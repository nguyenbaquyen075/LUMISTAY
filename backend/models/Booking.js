const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  guestInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    nationality: { type: String, default: 'Việt Nam' },
    note: { type: String, default: '' }
  },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  guests: {
    adults: { type: Number, required: true, min: 1, default: 1 },
    children: { type: Number, default: 0 }
  },
  nights: { type: Number, required: true },
  pricePerNight: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'transfer', 'online'],
    default: 'cash'
  },
  specialRequests: [{ type: String }],
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

module.exports = mongoose.model('Booking', bookingSchema);
