const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: false },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: false },
  guestName: { type: String, required: true },
  guestAvatar: { type: String, default: '' },
  guestNationality: { type: String, default: 'Việt Nam' },
  guestTitle: { type: String, default: 'Khách hàng' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  ratings: {
    service: { type: Number, min: 1, max: 5, default: 5 },
    cleanliness: { type: Number, min: 1, max: 5, default: 5 },
    location: { type: Number, min: 1, max: 5, default: 5 },
    value: { type: Number, min: 1, max: 5, default: 5 }
  },
  title: { type: String, default: '' },
  content: { type: String, required: true },
  isApproved: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
