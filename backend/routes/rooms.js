const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { protect, authorize } = require('../middleware/auth');

// @GET /api/rooms - Get all rooms with filters
router.get('/', async (req, res) => {
  try {
    const { type, minPrice, maxPrice, guests, available, featured, page = 1, limit = 12 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (available !== undefined) filter.isAvailable = available === 'true';
    if (featured === 'true') filter.isFeatured = true;
    if (guests) filter.maxGuests = { $gte: parseInt(guests) };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }
    const total = await Room.countDocuments(filter);
    const rooms = await Room.find(filter)
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    res.json({ success: true, count: rooms.length, total, rooms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/rooms/:id
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Phòng không tồn tại.' });
    res.json({ success: true, room });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/rooms - Admin only
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json({ success: true, message: 'Tạo phòng thành công!', room });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @PUT /api/rooms/:id - Admin only
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!room) return res.status(404).json({ success: false, message: 'Phòng không tồn tại.' });
    res.json({ success: true, message: 'Cập nhật phòng thành công!', room });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @DELETE /api/rooms/:id - Admin only
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Phòng không tồn tại.' });
    res.json({ success: true, message: 'Xóa phòng thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
