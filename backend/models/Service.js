const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['restaurant', 'spa', 'pool', 'gym', 'transport', 'other'],
    required: true
  },
  description: { type: String, required: true },
  shortDescription: { type: String, default: '' },
  image: { type: String, default: '' },
  icon: { type: String, default: '' },
  price: { type: Number, default: 0 },
  isAvailable: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  openTime: { type: String, default: '06:00' },
  closeTime: { type: String, default: '22:00' },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Service', serviceSchema);
