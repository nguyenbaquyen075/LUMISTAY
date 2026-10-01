const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const RoomType = require('../models/RoomType');
const RatePlan = require('../models/RatePlan');
const HotelSettings = require('../models/HotelSettings');
const { protect } = require('../middleware/auth');
const { need } = require('../middleware/permissions');
const audit = require('../utils/audit');

router.use(protect);

const wrap = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
const fail = (res, code, message) => res.status(code).json({ success: false, message });

// ───────────── Hotel settings ─────────────
router.get('/settings', need('settings.view', 'rates.view', 'bookings.view'), wrap(async (req, res) => {
  const s = await HotelSettings.get();
  res.json({ success: true, settings: { ...s.toObject(), commissions: Object.fromEntries(s.commissions || []) } });
}));

router.put('/settings', need('settings.edit'), wrap(async (req, res) => {
  const s = await HotelSettings.get();
  const b = req.body;
  for (const k of ['name', 'address', 'phone', 'email', 'taxCode', 'checkInTime', 'checkOutTime']) if (b[k] !== undefined) s[k] = b[k];
  for (const k of ['vatRate', 'serviceChargeRate', 'weekendSurchargePercent', 'earlyCheckInFeePercent', 'lateCheckOutFeePercent']) {
    if (b[k] !== undefined) {
      const v = Number(b[k]);
      if (!(v >= 0 && v <= 100)) return fail(res, 400, `Giá trị "${k}" phải từ 0 đến 100.`);
      s[k] = v;
    }
  }
  if (b.seasons) s.seasons = b.seasons.filter((x) => x.name && x.from && x.to).map((x) => ({ name: x.name, from: x.from, to: x.to, adjustPercent: Number(x.adjustPercent) || 0 }));
  if (b.commissions) s.commissions = b.commissions;
  if (b.bank) s.bank = { ...s.bank.toObject(), ...b.bank };
  await s.save();
  audit(req, 'settings.edit', 'settings', 'main', 'Cập nhật cấu hình khách sạn');
  res.json({ success: true, settings: { ...s.toObject(), commissions: Object.fromEntries(s.commissions || []) } });
}));

// ───────────── Room types ─────────────
router.get('/room-types', need('rates.view'), wrap(async (req, res) => {
  const [types, rooms] = await Promise.all([RoomType.find().sort({ basePrice: 1 }), Room.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }])]);
  const counts = Object.fromEntries(rooms.map((r) => [r._id, r.count]));
  res.json({ success: true, roomTypes: types.map((t) => ({ ...t.toObject(), rooms: counts[t.name] || 0 })) });
}));

router.post('/room-types', need('rates.edit'), wrap(async (req, res) => {
  const t = await RoomType.create(req.body);
  audit(req, 'roomtype.create', 'roomtype', t._id, t.name);
  res.status(201).json({ success: true, roomType: t });
}));

router.put('/room-types/:id', need('rates.edit'), wrap(async (req, res) => {
  const t = await RoomType.findById(req.params.id);
  if (!t) return fail(res, 404, 'Không tìm thấy hạng phòng.');
  delete req.body.name; // rooms reference the type by name
  const before = t.basePrice;
  Object.assign(t, req.body);
  await t.save();
  if (t.basePrice !== before) await Room.updateMany({ type: t.name }, { price: t.basePrice }); // website shows the type's rack rate
  audit(req, 'roomtype.edit', 'roomtype', t._id, `${t.name}${t.basePrice !== before ? ` · giá ${before} → ${t.basePrice}` : ''}`);
  res.json({ success: true, roomType: t });
}));

router.delete('/room-types/:id', need('rates.edit'), wrap(async (req, res) => {
  const t = await RoomType.findById(req.params.id);
  if (!t) return fail(res, 404, 'Không tìm thấy hạng phòng.');
  if (await Room.exists({ type: t.name })) return fail(res, 400, 'Còn phòng thuộc hạng này, không thể xóa.');
  await t.deleteOne();
  audit(req, 'roomtype.delete', 'roomtype', t._id, t.name);
  res.json({ success: true });
}));

// ───────────── Rate plans ─────────────
router.get('/rate-plans', need('rates.view'), wrap(async (req, res) => {
  res.json({ success: true, ratePlans: await RatePlan.find().sort({ isDefault: -1, code: 1 }) });
}));

router.post('/rate-plans', need('rates.edit'), wrap(async (req, res) => {
  if (req.body.isDefault) await RatePlan.updateMany({}, { isDefault: false });
  const p = await RatePlan.create(req.body);
  audit(req, 'rateplan.create', 'rateplan', p._id, `${p.code} · ${p.adjustPercent}%`);
  res.status(201).json({ success: true, ratePlan: p });
}));

router.put('/rate-plans/:id', need('rates.edit'), wrap(async (req, res) => {
  if (req.body.isDefault) await RatePlan.updateMany({ _id: { $ne: req.params.id } }, { isDefault: false });
  const p = await RatePlan.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
  if (!p) return fail(res, 404, 'Không tìm thấy gói giá.');
  audit(req, 'rateplan.edit', 'rateplan', p._id, `${p.code} · ${p.adjustPercent}%`);
  res.json({ success: true, ratePlan: p });
}));

router.delete('/rate-plans/:id', need('rates.edit'), wrap(async (req, res) => {
  const p = await RatePlan.findById(req.params.id);
  if (!p) return fail(res, 404, 'Không tìm thấy gói giá.');
  if (p.isDefault) return fail(res, 400, 'Không thể xóa gói giá mặc định.');
  if (await Booking.exists({ ratePlan: p._id, status: { $in: ['pending', 'confirmed', 'checked_in'] } })) {
    return fail(res, 400, 'Còn đặt phòng đang dùng gói giá này. Hãy tắt gói thay vì xóa.');
  }
  await p.deleteOne();
  audit(req, 'rateplan.delete', 'rateplan', p._id, p.code);
  res.json({ success: true });
}));

module.exports = router;
