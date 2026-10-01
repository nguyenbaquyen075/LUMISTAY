const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên phòng'],
    trim: true
  },
  type: { type: String, required: true, trim: true }, // matches RoomType.name
  description: { type: String, required: true },
  shortDescription: { type: String, default: '' },
  price: { // display price for the website; bookings are priced from RoomType + rate plan
    type: Number,
    required: [true, 'Vui lòng nhập giá phòng'],
    min: [0, 'Giá không được âm']
  },
  area: { type: Number, required: true }, // m2
  maxGuests: { type: Number, required: true, default: 2 },
  bedrooms: { type: Number, default: 1 },
  bathrooms: { type: Number, default: 1 },
  images: [{ type: String }],
  amenities: [{ type: String }],
  features: [{
    icon: String,
    label: String
  }],
  roomNumber: { type: String, trim: true, unique: true, sparse: true },
  floor: { type: Number, default: 1 },
  // Out-of-order state set by managers. occupied/reserved are derived from bookings (see utils/analytics.js).
  status: { type: String, enum: ['available', 'maintenance', 'locked'], default: 'available' },
  // Housekeeping state
  hkStatus: { type: String, enum: ['clean', 'dirty', 'inspected'], default: 'clean' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  hkNote: { type: String, default: '' },
  isAvailable: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  // false = physical room that exists only for operations (not shown on the public website)
  listed: { type: Boolean, default: true },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', roomSchema);
