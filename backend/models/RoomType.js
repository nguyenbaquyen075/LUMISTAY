const mongoose = require('mongoose');

// Room category ("hạng phòng"). `name` matches Room.type; physical rooms are grouped by it.
const roomTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  basePrice: { type: Number, required: true, min: 0 }, // rack rate per night, before season/plan/tax
  baseAdults: { type: Number, default: 2 },            // adults included in the base price
  maxAdults: { type: Number, default: 2 },
  maxChildren: { type: Number, default: 1 },
  freeChildren: { type: Number, default: 1 },          // children per room that stay free
  extraAdultFee: { type: Number, default: 0 },         // per extra adult per night
  childFee: { type: Number, default: 0 },              // per chargeable child per night
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RoomType', roomTypeSchema);
