const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

// @POST /api/bookings - Create booking (public - no auth needed, optionally linked to user)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { roomId, checkIn, checkOut, guests, guestInfo, specialRequests, paymentMethod } = req.body;
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ success: false, message: 'Phòng không tồn tại.' });
    if (!room.isAvailable) return res.status(400).json({ success: false, message: 'Phòng hiện không có sẵn.' });

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    if (nights < 1) return res.status(400).json({ success: false, message: 'Ngày trả phòng phải sau ngày nhận phòng.' });

    const totalPrice = nights * room.price;
    const booking = await Booking.create({
      room: roomId,
      user: req.user ? req.user._id : undefined,
      guestInfo,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests,
      nights,
      pricePerNight: room.price,
      totalPrice,
      specialRequests: specialRequests || [],
      paymentMethod: paymentMethod || 'cash'
    });

    await booking.populate('room', 'name type images price');
    res.status(201).json({
      success: true,
      message: 'Đặt phòng thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.',
      booking
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @GET /api/bookings - Admin: get all; User: get own
router.get('/', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (req.user.role !== 'admin') filter.user = req.user._id;
    if (status) filter.status = status;
    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .populate('room', 'name type images price')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    res.json({ success: true, count: bookings.length, total, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/bookings/code/:code - Get by booking code (public)
router.get('/code/:code', async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingCode: req.params.code })
      .populate('room', 'name type images price');
    if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy đặt phòng.' });
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/bookings/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('room').populate('user', 'name email phone');
    if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy đặt phòng.' });
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/bookings/:id/status - Admin only
router.put('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status, paymentStatus },
      { new: true }
    ).populate('room', 'name type images price');
    if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy đặt phòng.' });
    res.json({ success: true, message: 'Cập nhật trạng thái thành công!', booking });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @PUT /api/bookings/:id/cancel - Cancel booking
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy đặt phòng.' });
    if (booking.status === 'cancelled') return res.status(400).json({ success: false, message: 'Đặt phòng đã bị hủy.' });
    booking.status = 'cancelled';
    await booking.save();
    res.json({ success: true, message: 'Hủy đặt phòng thành công!', booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/bookings/stats - Admin stats
router.get('/admin/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const totalRevenue = await Booking.aggregate([
      { $match: { status: { $ne: 'cancelled' }, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    res.json({
      success: true,
      stats: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
