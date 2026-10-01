const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const RoomType = require('../models/RoomType');
const { protect } = require('../middleware/auth');
const { need, can } = require('../middleware/permissions');
const { roomBoard } = require('../utils/analytics');
const audit = require('../utils/audit');

// Rooms inherit the room type's price unless one is given
const resolvePrice = async (body, partial) => {
  if (partial && !body.type) return null;
  const type = await RoomType.findOne({ name: body.type });
  if (!type) return 'Hạng phòng chưa tồn tại. Hãy tạo ở mục Giá phòng trước.';
  if (body.price === undefined || body.price === '' || body.price === null) body.price = type.basePrice;
  return null;
};

// @GET /api/rooms - Get all rooms with filters
router.get('/', async (req, res) => {
  try {
    const { type, minPrice, maxPrice, guests, available, featured, page = 1, limit = 12 } = req.query;
    const filter = { listed: { $ne: false } };
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
    console.error(err); res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

// @GET /api/rooms/board - staff: every room with live status for the floor plan
router.get('/board', protect, need('rooms.view'), async (req, res) => {
  try {
    res.json({ success: true, rooms: await roomBoard() });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

// @PUT /api/rooms/:id/status { status } - managers: available / maintenance / locked (out of order)
router.put('/:id/status', protect, need('rooms.status'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!Room.schema.path('status').enumValues.includes(status)) return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ.' });
    if (status !== 'available' && await Booking.exists({ room: req.params.id, status: 'checked_in' })) {
      return res.status(400).json({ success: false, message: 'Phòng đang có khách ở, hãy đổi phòng hoặc check-out trước.' });
    }
    const room = await Room.findByIdAndUpdate(req.params.id, { status }, { returnDocument: 'after' });
    if (!room) return res.status(404).json({ success: false, message: 'Phòng không tồn tại.' });
    audit(req, 'room.status', 'room', room._id, `${room.roomNumber || room.name} → ${status}`);
    res.json({ success: true, room });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

// @PUT /api/rooms/:id/housekeeping { hkStatus, assignedTo, note } - clean / dirty by housekeeping & front desk; inspected + assignment by supervisors
router.put('/:id/housekeeping', protect, need('housekeeping.update', 'housekeeping.manage'), async (req, res) => {
  try {
    const { hkStatus, assignedTo, note } = req.body;
    const set = {};
    if (hkStatus !== undefined) {
      if (!Room.schema.path('hkStatus').enumValues.includes(hkStatus)) return res.status(400).json({ success: false, message: 'Trạng thái buồng phòng không hợp lệ.' });
      if (hkStatus === 'inspected' && !can(req.user, 'housekeeping.manage')) return res.status(403).json({ success: false, message: 'Chỉ quản lý buồng phòng được xác nhận "Đã kiểm tra".' });
      set.hkStatus = hkStatus;
    }
    if (assignedTo !== undefined) {
      if (!can(req.user, 'housekeeping.manage')) return res.status(403).json({ success: false, message: 'Bạn không có quyền phân công.' });
      set.assignedTo = assignedTo || null;
    }
    if (note !== undefined) set.hkNote = note;
    const room = await Room.findByIdAndUpdate(req.params.id, set, { returnDocument: 'after' });
    if (!room) return res.status(404).json({ success: false, message: 'Phòng không tồn tại.' });
    audit(req, 'room.housekeeping', 'room', room._id, `${room.roomNumber || room.name} · ${JSON.stringify(set)}`);
    res.json({ success: true, room });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

// @GET /api/rooms/:id/history - staff: past and upcoming stays in this room
router.get('/:id/history', protect, need('bookings.view'), async (req, res) => {
  try {
    const bookings = await Booking.find({ room: req.params.id })
      .select('bookingCode guestInfo.name checkIn checkOut nights status totalPrice')
      .sort({ checkIn: -1 }).limit(100);
    res.json({ success: true, bookings });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

// @GET /api/rooms/:id
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Phòng không tồn tại.' });
    res.json({ success: true, room });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

// @POST /api/rooms - Admin only
router.post('/', protect, need('rooms.edit'), async (req, res) => {
  try {
    const problem = await resolvePrice(req.body, false);
    if (problem) return res.status(400).json({ success: false, message: problem });
    const room = await Room.create(req.body);
    audit(req, 'room.create', 'room', room._id, `${room.roomNumber || ''} ${room.name}`);
    res.status(201).json({ success: true, message: 'Tạo phòng thành công!', room });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @PUT /api/rooms/:id - Admin only
router.put('/:id', protect, need('rooms.edit'), async (req, res) => {
  try {
    const problem = await resolvePrice(req.body, true);
    if (problem) return res.status(400).json({ success: false, message: problem });
    delete req.body.status; // out-of-order state has its own endpoint
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
    if (!room) return res.status(404).json({ success: false, message: 'Phòng không tồn tại.' });
    audit(req, 'room.edit', 'room', room._id, `${room.roomNumber || ''} ${room.name}`);
    res.json({ success: true, message: 'Cập nhật phòng thành công!', room });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @DELETE /api/rooms/:id - Admin only
router.delete('/:id', protect, need('rooms.edit'), async (req, res) => {
  try {
    if (await Booking.exists({ room: req.params.id, status: { $in: ['pending', 'confirmed', 'checked_in'] } })) {
      return res.status(400).json({ success: false, message: 'Phòng đang có đặt phòng chưa hoàn tất, không thể xóa.' });
    }
    const room = await Room.findByIdAndDelete(req.params.id);
    if (room) audit(req, 'room.delete', 'room', room._id, `${room.roomNumber || ''} ${room.name}`);
    if (!room) return res.status(404).json({ success: false, message: 'Phòng không tồn tại.' });
    res.json({ success: true, message: 'Xóa phòng thành công!' });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

module.exports = router;
