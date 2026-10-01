// Hotel operations: housekeeping, night audit, cashier shifts, residence registration, reports, audit trail
const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User');
const Shift = require('../models/Shift');
const NightAudit = require('../models/NightAudit');
const AuditLog = require('../models/AuditLog');
const HotelSettings = require('../models/HotelSettings');
const { protect } = require('../middleware/auth');
const { need, can } = require('../middleware/permissions');
const A = require('../utils/analytics');
const { penalty } = require('../utils/policy');
const audit = require('../utils/audit');

const { startOfDay, addDays, dayKey, sum } = A;
router.use(protect);

const wrap = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
};
const fail = (res, code, message) => res.status(code).json({ success: false, message });
const parseDay = (s, fallback) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : fallback;
};
const guestBrief = (b) => ({
  _id: b._id, bookingCode: b.bookingCode, status: b.status, guest: b.guestInfo.name, roomType: b.roomType,
  room: b.room?.roomNumber || b.room?.name || null, checkIn: b.checkIn, checkOut: b.checkOut, nights: b.nights,
  guests: b.guests, balance: A.balance(b), source: b.source
});

// ───────────── Housekeeping ─────────────
router.get('/housekeeping', need('housekeeping.view'), wrap(async (req, res) => {
  const today = startOfDay();
  const tomorrow = addDays(today, 1);
  const [board, arrivals, departures] = await Promise.all([
    A.roomBoard(),
    Booking.find({ checkIn: { $gte: today, $lt: tomorrow }, status: { $in: A.ACTIVE }, room: { $ne: null } }).select('room').lean(),
    Booking.find({ checkOut: { $gte: today, $lt: tomorrow }, status: { $in: ['checked_in', 'checked_out'] }, room: { $ne: null } }).select('room').lean()
  ]);
  const arriving = new Set(arrivals.map((b) => String(b.room)));
  const leaving = new Set(departures.map((b) => String(b.room)));
  const rooms = board.map((r) => ({
    _id: r._id, roomNumber: r.roomNumber, floor: r.floor, type: r.type, displayStatus: r.displayStatus, status: r.status,
    hkStatus: r.hkStatus, hkNote: r.hkNote, assignedTo: r.assignedTo || null,
    arrivalToday: arriving.has(String(r._id)), departureToday: leaving.has(String(r._id)),
    occupied: r.displayStatus === 'occupied',
    guest: r.currentBooking?.guestInfo?.name || null
  }));
  res.json({ success: true, rooms });
}));

router.get('/housekeepers', need('housekeeping.view'), wrap(async (req, res) => {
  res.json({ success: true, housekeepers: await User.find({ role: 'housekeeping', isActive: true }).select('name') });
}));

router.post('/housekeeping/assign', need('housekeeping.manage'), wrap(async (req, res) => {
  const { roomIds, userId } = req.body;
  if (!Array.isArray(roomIds) || !roomIds.length) return fail(res, 400, 'Chưa chọn phòng.');
  await Room.updateMany({ _id: { $in: roomIds } }, { assignedTo: userId || null });
  audit(req, 'housekeeping.assign', 'room', roomIds.join(','), `${roomIds.length} phòng → ${userId || 'bỏ phân công'}`);
  res.json({ success: true });
}));

// ───────────── Night audit ─────────────
const nextAuditDate = async () => {
  const last = await NightAudit.findOne().sort({ date: -1 });
  return { last, date: last ? dayKey(addDays(parseDay(last.date), 1)) : dayKey(new Date()) };
};

router.get('/night-audit', need('audit.run', 'audit.view'), wrap(async (req, res) => {
  const { last, date } = await nextAuditDate();
  const d = parseDay(date);
  const dEnd = addDays(d, 1);
  const [arrivals, overdue, inHouse, dirty, history] = await Promise.all([
    Booking.find({ checkIn: { $gte: d, $lt: dEnd }, status: { $in: ['pending', 'confirmed'] } }).populate('room', 'name roomNumber').lean(),
    Booking.find({ checkOut: { $lt: dEnd }, status: 'checked_in' }).populate('room', 'name roomNumber').lean(),
    Booking.find({ status: 'checked_in', checkIn: { $lt: dEnd } }).populate('room', 'name roomNumber').lean(),
    Room.countDocuments({ hkStatus: 'dirty' }),
    NightAudit.find().sort({ date: -1 }).limit(14).lean()
  ]);
  res.json({
    success: true, businessDate: date, canRun: date <= dayKey(new Date()), lastClosed: last?.date || null,
    pendingArrivals: arrivals.map(guestBrief),
    overdueDepartures: overdue.map(guestBrief),
    inHouse: inHouse.length, unpaidInHouse: sum(inHouse, A.balance), dirtyRooms: dirty,
    history
  });
}));

router.post('/night-audit/run', need('audit.run'), wrap(async (req, res) => {
  const { date } = await nextAuditDate();
  if (date > dayKey(new Date())) return fail(res, 400, 'Ngày này chưa kết thúc nên chưa thể chốt.');
  const d = parseDay(date);
  const dEnd = addDays(d, 1);
  const settings = await HotelSettings.get();

  // 1. Arrivals that never showed up
  let noShows = 0;
  if (req.body.markNoShow !== false) {
    const pending = await Booking.find({ checkIn: { $gte: d, $lt: dEnd }, status: { $in: ['pending', 'confirmed'] } });
    for (const b of pending) {
      const fee = penalty(b, settings, new Date(8.64e15)).fee;
      if (fee > 0) b.charges.push({ label: 'Phí no-show', category: 'fee', amount: fee, at: d, by: 'Chốt ngày' });
      b.status = 'no_show';
      b.history.push({ action: `No-show (chốt ngày ${date})${fee ? ' · phí ' + Math.round(fee).toLocaleString('vi-VN') + 'đ' : ''}`, by: req.user.name });
      await b.save();
      noShows += 1;
    }
  }

  // 2. Stayover rooms need service tomorrow
  const inHouse = await Booking.find({ status: 'checked_in', checkIn: { $lt: dEnd }, checkOut: { $gt: d }, room: { $ne: null } }).select('room');
  await Room.updateMany({ _id: { $in: inHouse.map((b) => b.room) } }, { hkStatus: 'dirty' });

  // 3. Snapshot of the day
  const bookings = await A.loadBookings(d, dEnd);
  const [day] = A.buildDaily(bookings, d, dEnd);
  const k = A.kpis([day], await A.sellableRooms());
  const paidToday = await Booking.find({ 'payments.at': { $gte: d, $lt: dEnd } }).select('payments').lean();
  const payments = {};
  for (const p of paidToday.flatMap((b) => b.payments).filter((p) => p.at >= d && p.at < dEnd)) {
    payments[p.method] = (payments[p.method] || 0) + (p.type === 'refund' ? -p.amount : p.amount);
  }
  const record = await NightAudit.create({
    date, runBy: req.user.name, noShows, inHouse: inHouse.length, payments,
    figures: { sold: k.sold, available: k.available, occupancy: k.occupancy, adr: k.adr, revpar: k.revpar, roomRevenue: k.roomRevenue, serviceRevenue: k.serviceRevenue, foodRevenue: k.foodRevenue, totalRevenue: k.totalRevenue }
  });
  audit(req, 'nightaudit.run', 'nightaudit', date, `Chốt ngày ${date} · ${noShows} no-show`);
  res.json({ success: true, message: `Đã chốt ngày ${date}.`, audit: record });
}));

// ───────────── Cashier shifts ─────────────
const shiftTotals = async (shiftId) => {
  const rows = await Booking.aggregate([
    { $unwind: '$payments' },
    { $match: { 'payments.shift': shiftId } },
    { $group: { _id: { method: '$payments.method', type: '$payments.type' }, total: { $sum: '$payments.amount' } } }
  ]);
  const byMethod = {};
  for (const r of rows) byMethod[r._id.method] = (byMethod[r._id.method] || 0) + (r._id.type === 'refund' ? -r.total : r.total);
  return { byMethod, cashNet: byMethod.cash || 0 };
};

router.get('/shifts/current', need('shift.use'), wrap(async (req, res) => {
  const shift = await Shift.findOne({ user: req.user._id, status: 'open' }).lean();
  if (!shift) return res.json({ success: true, shift: null });
  const t = await shiftTotals(shift._id);
  res.json({ success: true, shift: { ...shift, ...t, expectedCash: shift.openingCash + t.cashNet } });
}));

router.post('/shifts/open', need('shift.use'), wrap(async (req, res) => {
  if (await Shift.exists({ user: req.user._id, status: 'open' })) return fail(res, 400, 'Bạn đang có một ca đang mở.');
  const openingCash = Number(req.body.openingCash) || 0;
  if (openingCash < 0) return fail(res, 400, 'Tiền đầu ca không hợp lệ.');
  const shift = await Shift.create({ user: req.user._id, userName: req.user.name, openingCash });
  audit(req, 'shift.open', 'shift', shift._id, `Mở ca · đầu ca ${openingCash}`);
  res.status(201).json({ success: true, shift });
}));

router.post('/shifts/close', need('shift.use'), wrap(async (req, res) => {
  const shift = await Shift.findOne({ user: req.user._id, status: 'open' });
  if (!shift) return fail(res, 400, 'Bạn chưa mở ca.');
  const counted = Number(req.body.countedCash);
  if (!(counted >= 0)) return fail(res, 400, 'Vui lòng nhập số tiền mặt kiểm đếm.');
  const t = await shiftTotals(shift._id);
  Object.assign(shift, {
    status: 'closed', closedAt: new Date(), countedCash: counted,
    expectedCash: shift.openingCash + t.cashNet, variance: counted - (shift.openingCash + t.cashNet), note: req.body.note || ''
  });
  await shift.save();
  audit(req, 'shift.close', 'shift', shift._id, `Kết ca · lệch ${shift.variance}`);
  res.json({ success: true, shift: { ...shift.toObject(), byMethod: t.byMethod } });
}));

router.get('/shifts', need('shift.use', 'shift.view_all'), wrap(async (req, res) => {
  const shifts = await Shift.find(can(req.user, 'shift.view_all') ? {} : { user: req.user._id }).sort({ openedAt: -1 }).limit(30).lean();
  res.json({ success: true, shifts });
}));

// ───────────── Temporary-residence registration ─────────────
router.get('/residence', need('residence'), wrap(async (req, res) => {
  const today = startOfDay();
  const bookings = await Booking.find({
    $or: [{ status: 'checked_in' }, { status: { $in: ['pending', 'confirmed'] }, checkIn: { $gte: today, $lt: addDays(today, 1) } }]
  }).populate('room', 'name roomNumber').sort({ checkIn: 1 }).lean();
  res.json({
    success: true,
    bookings: bookings.map((b) => ({
      ...guestBrief(b), guestInfo: b.guestInfo, occupants: b.occupants, residence: b.residence,
      missingId: !(b.guestInfo.idNumber || b.occupants.some((o) => o.idNumber))
    }))
  });
}));

// ───────────── Arrivals / departures / in-house for a date ─────────────
router.get('/day-lists', need('bookings.view'), wrap(async (req, res) => {
  const d = parseDay(req.query.date, startOfDay());
  const dEnd = addDays(d, 1);
  const pop = (q) => q.populate('room', 'name roomNumber').lean();
  const [arrivals, departures, inHouse] = await Promise.all([
    pop(Booking.find({ checkIn: { $gte: d, $lt: dEnd }, status: { $nin: ['cancelled', 'no_show'] } })),
    pop(Booking.find({ checkOut: { $gte: d, $lt: dEnd }, status: { $nin: ['cancelled', 'no_show'] } })),
    pop(Booking.find({ checkIn: { $lt: dEnd }, checkOut: { $gt: d }, status: { $in: ['checked_in', 'confirmed', 'pending'] } }))
  ]);
  res.json({ success: true, date: dayKey(d), arrivals: arrivals.map(guestBrief), departures: departures.map(guestBrief), inHouse: inHouse.map(guestBrief) });
}));

// ───────────── Reports ─────────────
router.get('/reports', need('reports.view'), wrap(async (req, res) => {
  const today = startOfDay();
  const from = parseDay(req.query.from, addDays(today, -29));
  const to = parseDay(req.query.to, today);
  if (to < from) return fail(res, 400, 'Khoảng ngày không hợp lệ.');
  if ((to - from) / A.DAY > 366) return fail(res, 400, 'Chỉ xem báo cáo tối đa 366 ngày.');
  const toExcl = addDays(to, 1);

  const [all, settings, rooms] = await Promise.all([A.loadBookings(from, toExcl), HotelSettings.get(), A.sellableRooms()]);
  const daily = A.buildDaily(all, from, toExcl);
  const summary = A.kpis(daily, rooms);

  const arriving = all.filter((b) => b.checkIn >= from && b.checkIn < toExcl);
  const stayed = arriving.filter((b) => !A.NO_STAY.includes(b.status));
  const net = (b) => A.roomTotal(b) + A.extrasTotal(b);
  const group = (list, keyFn) => {
    const m = {};
    for (const b of list) {
      const k = keyFn(b);
      const g = (m[k] ||= { key: k, bookings: 0, nights: 0, revenue: 0, commission: 0 });
      g.bookings += 1; g.nights += b.nights; g.revenue += net(b); g.commission += (net(b) * (b.commissionPercent || 0)) / 100;
    }
    return Object.values(m).sort((a, b) => b.revenue - a.revenue);
  };
  const revenueBookings = stayed.filter((b) => A.REVENUE.includes(b.status));

  // nights per room type inside the range, for ADR by type
  const typeNights = {};
  for (const b of all.filter((x) => A.REVENUE.includes(x.status))) {
    for (let d = startOfDay(b.checkIn); d < b.checkOut; d = addDays(d, 1)) if (d >= from && d < toExcl) typeNights[A.typeOf(b)] = (typeNights[A.typeOf(b)] || 0) + 1;
  }
  const byType = {};
  for (const d of daily) for (const [t, v] of Object.entries(d.byType)) byType[t] = (byType[t] || 0) + v;

  res.json({
    success: true, from: dayKey(from), to: dayKey(to), roomsAvailable: rooms, summary,
    daily: daily.map((d) => ({
      date: d.date, sold: d.sold, occupancy: rooms ? d.sold / rooms : 0, adr: d.sold ? d.roomRevenue / d.sold : 0,
      revpar: rooms ? d.roomRevenue / rooms : 0, roomRevenue: d.roomRevenue, otherRevenue: d.serviceRevenue + d.foodRevenue, revenue: d.revenue
    })),
    bySource: group(revenueBookings, (b) => b.source),
    byNationality: group(revenueBookings, (b) => b.guestInfo.nationality || 'Khác'),
    byRoomType: Object.entries(byType).map(([type, revenue]) => ({ type, revenue, nights: typeNights[type] || 0, adr: typeNights[type] ? revenue / typeNights[type] : 0 })).sort((a, b) => b.revenue - a.revenue),
    stats: {
      bookings: arriving.length,
      avgLeadDays: stayed.length ? sum(stayed, (b) => Math.max(0, (b.checkIn - b.createdAt) / A.DAY)) / stayed.length : 0,
      avgLos: stayed.length ? sum(stayed, (b) => b.nights) / stayed.length : 0,
      cancelRate: arriving.length ? arriving.filter((b) => b.status === 'cancelled').length / arriving.length : 0,
      noShowRate: arriving.length ? arriving.filter((b) => b.status === 'no_show').length / arriving.length : 0
    },
    commissions: Object.fromEntries(settings.commissions || [])
  });
}));

// ───────────── Audit trail ─────────────
router.get('/audit', need('audit.view'), wrap(async (req, res) => {
  const { entity, q, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (entity) filter.entity = entity;
  if (q) {
    const rx = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ summary: rx }, { userName: rx }, { action: rx }];
  }
  const lim = Math.min(parseInt(limit) || 50, 200);
  const [total, logs] = await Promise.all([
    AuditLog.countDocuments(filter),
    AuditLog.find(filter).sort({ at: -1 }).skip((parseInt(page) - 1) * lim).limit(lim).lean()
  ]);
  res.json({ success: true, total, logs });
}));

module.exports = router;
