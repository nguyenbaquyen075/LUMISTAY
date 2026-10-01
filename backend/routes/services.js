const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const { protect } = require('../middleware/auth');
const { need } = require('../middleware/permissions');

router.get('/', async (req, res) => {
  try {
    const { category, featured } = req.query;
    const filter = { isAvailable: true };
    if (category) filter.category = category;
    if (featured === 'true') filter.isFeatured = true;
    const services = await Service.find(filter).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, count: services.length, services });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

router.post('/', protect, need('rooms.edit'), async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json({ success: true, service });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/:id', protect, need('rooms.edit'), async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json({ success: true, service });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/:id', protect, need('rooms.edit'), async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Xóa dịch vụ thành công!' });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

module.exports = router;
