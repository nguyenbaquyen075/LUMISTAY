const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên phòng'],
    trim: true
  },
  type: {
    type: String,
    enum: ['Superior', 'Deluxe', 'Executive', 'Suite', 'Premier Suite', 'Family Room', 'Villa', 'Standard'],
    required: true
  },
  description: { type: String, required: true },
  shortDescription: { type: String, default: '' },
  price: {
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
  floor: { type: Number, default: 1 },
  isAvailable: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', roomSchema);
