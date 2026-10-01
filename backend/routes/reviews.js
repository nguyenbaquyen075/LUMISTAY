const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Room = require('../models/Room');
const { protect } = require('../middleware/auth');
const { need } = require('../middleware/permissions');

// @GET /api/reviews
router.get('/', async (req, res) => {
  try {
    const { featured, roomId, page = 1, limit = 10 } = req.query;
    const filter = { isApproved: true };
    if (featured === 'true') filter.isFeatured = true;
    if (roomId) filter.room = roomId;
    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .populate('room', 'name type')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    res.json({ success: true, count: reviews.length, total, reviews });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

// @POST /api/reviews
router.post('/', async (req, res) => {
  try {
    const review = await Review.create(req.body);
    // Update room rating
    if (review.room) {
      const stats = await Review.aggregate([
        { $match: { room: review.room, isApproved: true } },
        { $group: { _id: '$room', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
      ]);
      if (stats.length > 0) {
        await Room.findByIdAndUpdate(review.room, {
          rating: Math.round(stats[0].avgRating * 10) / 10,
          reviewCount: stats[0].count
        });
      }
    }
    res.status(201).json({ success: true, message: 'Cảm ơn bạn đã đánh giá!', review });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @PUT /api/reviews/:id - Admin approve/feature
router.put('/:id', protect, need('rooms.edit'), async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json({ success: true, review });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @DELETE /api/reviews/:id
router.delete('/:id', protect, need('rooms.edit'), async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Xóa đánh giá thành công!' });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

module.exports = router;
