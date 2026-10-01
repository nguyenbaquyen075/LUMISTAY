const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Customer = require('../models/Customer');
const Shift = require('../models/Shift');
const HotelSettings = require('../models/HotelSettings');
const { protect, optionalAuth } = require('../middleware/auth');
const { need, can, DISCOUNT_LIMIT } = require('../middleware/permissions');
const A = require('../utils/analytics');
const { nightsBetween, priceStay, typeAvailability, roomConflict, planAllowsType, defaultPlan, RoomType, RatePlan } = require('../utils/pricing');
const audit = require('../utils/audit');
const { penalty } = require('../utils/policy');

const { startOfDay, addDays, sum, syncPaymentStatus } = A;
const STATUSES = Booking.schema.path('status').enumValues;
const { METHODS, SOURCES, CHARGE_CATEGORIES } = Booking;

const serverError = (res, err) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
};
const fail = (res, code, message) => res.status(code).json({ success: false, message });
const vnd = (n) => Math.round(n).toLocaleString('vi-VN') + 'đ';
const isOwner = (user, b) => b.user && String(b.user._id || b.user) === String(user._id);
const log = (booking, user, action) => booking.history.push({ action, by: user ? user.name : 'Khách (online)' });

// What the client needs to show the folio
const money = (b) => ({
  room: A.roomTotal(b), extras: A.extrasTotal(b), fees: A.feesTotal(b),
  service: A.serviceCharge(b), vat: A.vat(b), grand: A.grandTotal(b),
  paid: A.paidTotal(b), refunded: A.refundedTotal(b), balance: A.balance(b)
});
const view = (b) => ({ ...(b.toObject ? b.toObject() : b), money: money(b) });

// Rewrites totals from the nightly rates (after any discount change / reprice)
const recalc = (b) => {
  b.nights = b.nightlyRates.length;
  const gross = sum(b.nightlyRates);
  b.pricePerNight = b.nights ? Math.round(gross / b.nights) : 0;
  b.totalPrice = Math.round(gross * (1 - (b.discountPercent || 0) / 100));
};

// Free physical room of the booking's type for the whole stay (cleanOnly: ready for a guest right now)
const pickRoom = async (b, { cleanOnly = false } = {}) => {
  const rooms = await Room.find({ type: b.roomType, status: 'available' });
  const rank = { inspected: 0, clean: 1, dirty: 2 };
  rooms.sort((x, y) => rank[x.hkStatus] - rank[y.hkStatus] || x.floor - y.floor || String(x.roomNumber).localeCompare(String(y.roomNumber)));
  for (const r of rooms) {
    if (cleanOnly && r.hkStatus === 'dirty') continue;
    if (await roomConflict(r._id, b.checkIn, b.checkOut, b._id)) continue;
    if (await Booking.exists({ _id: { $ne: b._id }, room: r._id, status: 'checked_in' })) continue;
    return r;
  }
  return null;
};

const upsertCustomer = (guestInfo) => {
  if (!guestInfo?.email) return;
  const set = { name: guestInfo.name, phone: guestInfo.phone };
  if (guestInfo.idNumber) set.idNumber = guestInfo.idNumber;
  if (guestInfo.nationality) set.nationality = guestInfo.nationality;
  return Customer.findOneAndUpdate({ email: guestInfo.email.toLowerCase() }, { $set: set }, { upsert: true })
    .catch((e) => console.error('customer upsert', e.message));
};

// Cash needs an open shift; every payment is tagged with the cashier and shift
const recordPayment = async (req, booking, { amount, method, type, purpose }) => {
  const kind = type === 'refund' ? 'refund' : 'payment';
  if (kind === 'refund' && !can(req.user, 'payments.refund')) return { error: [403, 'Bạn không có quyền hoàn tiền.'] };
  if (kind === 'refund' && amount > A.paidTotal(booking) - A.refundedTotal(booking)) return { error: [400, 'Số tiền hoàn vượt quá số đã thanh toán.'] };
  const m = METHODS.includes(method) ? method : booking.paymentMethod;
  const shift = await Shift.findOne({ user: req.user._id, status: 'open' });
  if (m === 'cash' && !shift) return { error: [400, 'Vui lòng mở ca thu ngân trước khi thu hoặc hoàn tiền mặt.'] };
  booking.payments.push({ type: kind, purpose: purpose === 'deposit' ? 'deposit' : 'settlement', amount, method: m, by: req.user.name, shift: shift?._id });
  syncPaymentStatus(booking);
  return { kind };
};

const populateFull = (q) => q.populate('room').populate('user', 'name email phone');

// ───────────── Create (public site and staff) ─────────────
const createBooking = async (req, res, { staff }) => {
  const body = req.body;
  let room = null;
  let typeName = body.roomType;
  if (body.roomId) {
    room = await Room.findById(body.roomId);
    if (!room) return fail(res, 404, 'Phòng không tồn tại.');
    typeName = room.type;
  }
  if (!typeName) return fail(res, 400, 'Vui lòng chọn hạng phòng.');
  const [type, settings] = await Promise.all([RoomType.findOne({ name: typeName }), HotelSettings.get()]);
  if (!type) return fail(res, 400, 'Hạng phòng không tồn tại.');

  const plan = body.ratePlanId ? await RatePlan.findById(body.ratePlanId) : await defaultPlan();
  if (!plan || !plan.active || (!plan.isPublic && !staff) || !planAllowsType(plan, typeName)) return fail(res, 400, 'Gói giá không áp dụng được.');

  const checkIn = new Date(body.checkIn);
  const checkOut = new Date(body.checkOut);
  if (isNaN(checkIn) || isNaN(checkOut)) return fail(res, 400, 'Ngày không hợp lệ.');
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) return fail(res, 400, 'Ngày trả phòng phải sau ngày nhận phòng.');
  if (nights < plan.minStay) return fail(res, 400, `Gói giá này yêu cầu ở tối thiểu ${plan.minStay} đêm.`);

  const adults = Number(body.guests?.adults) || 1;
  const children = Number(body.guests?.children) || 0;
  if (adults > type.maxAdults || children > type.maxChildren) {
    return fail(res, 400, `Hạng ${type.name} tối đa ${type.maxAdults} người lớn và ${type.maxChildren} trẻ em.`);
  }

  const guestInfo = body.guestInfo;
  const known = guestInfo?.email ? await Customer.findOne({ email: guestInfo.email.toLowerCase() }) : null;
  if (known?.blacklisted && !(staff && body.force)) {
    return staff
      ? fail(res, 409, `Khách nằm trong danh sách đen (${known.blacklistReason || 'không rõ lý do'}). Chọn "Vẫn đặt" nếu quản lý đồng ý.`)
      : fail(res, 403, 'Không thể tạo đặt phòng với thông tin này. Vui lòng liên hệ khách sạn.');
  }

  if ((await typeAvailability(typeName, checkIn, checkOut)).free < 1) return fail(res, 409, 'Hạng phòng đã hết phòng trong khoảng thời gian này.');
  // Only staff pre-assign a specific room; online guests get one at check-in
  if (staff && room) {
    if (room.status !== 'available') return fail(res, 400, 'Phòng đang bảo trì hoặc bị khóa.');
    if (await roomConflict(room._id, checkIn, checkOut)) return fail(res, 409, 'Phòng này đã có người đặt trong khoảng thời gian này.');
  }

  const price = priceStay({ type, plan, checkIn, checkOut, adults, children, settings });
  const source = staff ? (SOURCES.includes(body.source) ? body.source : 'walk_in') : 'website';
  const booking = new Booking({
    user: req.user && !staff ? req.user._id : undefined,
    roomType: typeName,
    room: staff && room ? room._id : undefined,
    ratePlan: plan._id,
    ratePlanName: plan.name,
    policy: { nonRefundable: plan.nonRefundable, freeCancelHours: plan.freeCancelHours, penaltyNights: plan.penaltyNights, depositPercent: plan.depositPercent },
    guestInfo, checkIn, checkOut,
    guests: { adults, children },
    nights, nightlyRates: price.nightly, pricePerNight: Math.round(price.average), totalPrice: price.total,
    vatRate: settings.vatRate, serviceChargeRate: settings.serviceChargeRate,
    specialRequests: body.specialRequests || [],
    paymentMethod: METHODS.includes(body.paymentMethod) ? body.paymentMethod : 'cash',
    source, commissionPercent: settings.commissions.get(source) || 0,
    status: staff && STATUSES.includes(body.status) && ['pending', 'confirmed'].includes(body.status) ? body.status : 'pending'
  });
  log(booking, staff ? req.user : null, staff ? 'Tạo đặt phòng trực tiếp' : 'Khách đặt phòng online');

  if (staff && Number(body.deposit?.amount) > 0) {
    const r = await recordPayment(req, booking, { amount: Number(body.deposit.amount), method: body.deposit.method, purpose: 'deposit' });
    if (r.error) return fail(res, r.error[0], r.error[1]);
    log(booking, req.user, `Thu đặt cọc ${vnd(Number(body.deposit.amount))}`);
  }
  await booking.save();
  await upsertCustomer(guestInfo);
  audit(req, 'booking.create', 'booking', booking._id, `${booking.bookingCode} · ${guestInfo?.name} · ${typeName} · ${nights} đêm`);

  await booking.populate('room', 'name type roomNumber images price');
  res.status(201).json({
    success: true,
    message: 'Đặt phòng thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.',
    depositDue: Math.round((A.grandTotal(booking) * (plan.depositPercent || 0)) / 100),
    booking: view(booking)
  });
};

router.post('/', optionalAuth, async (req, res) => {
  try {
    await createBooking(req, res, { staff: false });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/admin/create', protect, need('bookings.manage'), async (req, res) => {
  try {
    await createBooking(req, res, { staff: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @GET /api/bookings/availability - free rooms and prices per room type for a stay
router.get('/availability', optionalAuth, async (req, res) => {
  try {
    const checkIn = new Date(req.query.checkIn);
    const checkOut = new Date(req.query.checkOut);
    if (isNaN(checkIn) || isNaN(checkOut) || nightsBetween(checkIn, checkOut) < 1) return fail(res, 400, 'Khoảng ngày không hợp lệ.');
    const adults = Number(req.query.adults) || 1;
    const children = Number(req.query.children) || 0;
    const staff = req.user && can(req.user, 'bookings.manage');
    const nights = nightsBetween(checkIn, checkOut);
    const [types, plans, settings] = await Promise.all([RoomType.find().sort({ basePrice: 1 }), RatePlan.find({ active: true }), HotelSettings.get()]);
    const result = [];
    for (const type of types) {
      const avail = await typeAvailability(type.name, checkIn, checkOut);
      result.push({
        type: type.toObject(), ...avail, nights,
        fits: adults <= type.maxAdults && children <= type.maxChildren,
        plans: plans
          .filter((p) => (p.isPublic || staff) && planAllowsType(p, type.name))
          .map((p) => {
            const price = priceStay({ type, plan: p, checkIn, checkOut, adults, children, settings });
            return { ...p.toObject(), total: price.total, average: Math.round(price.average), nightly: price.nightly, allowed: nights >= p.minStay };
          })
      });
    }
    res.json({ success: true, taxes: { vatRate: settings.vatRate, serviceChargeRate: settings.serviceChargeRate }, types: result });
  } catch (err) {
    serverError(res, err);
  }
});

// @GET /api/bookings - staff: all (filters); guest: own
router.get('/', protect, async (req, res) => {
  try {
    const { status, q, from, to, room, roomType, source, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (!can(req.user, 'bookings.view')) filter.user = req.user._id;
    if (status) filter.status = status;
    if (room) filter.room = room;
    if (roomType) filter.roomType = roomType;
    if (source) filter.source = source;
    if (from || to) {
      if (to) filter.checkIn = { $lt: new Date(to) };
      if (from) filter.checkOut = { $gt: new Date(from) };
    }
    if (q) {
      const rx = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ bookingCode: rx }, { 'guestInfo.name': rx }, { 'guestInfo.phone': rx }, { 'guestInfo.email': rx }];
    }
    const lim = Math.min(parseInt(limit) || 10, 500);
    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .populate('room', 'name type roomNumber images price')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(lim)
      .skip((parseInt(page) - 1) * lim);
    res.json({ success: true, count: bookings.length, total, bookings: bookings.map(view) });
  } catch (err) {
    serverError(res, err);
  }
});

// @GET /api/bookings/code/:code - lookup by booking code (public)
router.get('/code/:code', async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingCode: req.params.code }).populate('room', 'name type images price');
    if (!booking) return fail(res, 404, 'Không tìm thấy đặt phòng.');
    res.json({ success: true, booking: view(booking) });
  } catch (err) {
    serverError(res, err);
  }
});

router.get('/admin/stats', protect, need('bookings.view'), async (req, res) => {
  try {
    const [totalBookings, pendingBookings, confirmedBookings] = await Promise.all([
      Booking.countDocuments(), Booking.countDocuments({ status: 'pending' }), Booking.countDocuments({ status: 'confirmed' })
    ]);
    res.json({ success: true, stats: { totalBookings, pendingBookings, confirmedBookings } });
  } catch (err) {
    serverError(res, err);
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await populateFull(Booking.findById(req.params.id));
    if (!booking) return fail(res, 404, 'Không tìm thấy đặt phòng.');
    if (!can(req.user, 'bookings.view') && !isOwner(req.user, booking)) return fail(res, 403, 'Bạn không có quyền xem đặt phòng này.');
    res.json({ success: true, booking: view(booking) });
  } catch (err) {
    serverError(res, err);
  }
});

// ───────────── Staff mutations ─────────────
const withBooking = (perm, handler) => [
  protect, need(...[].concat(perm)),
  async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id);
      if (!booking) return fail(res, 404, 'Không tìm thấy đặt phòng.');
      await handler(req, res, booking);
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
];

const respond = async (req, res, booking, message, extra = {}) => {
  await booking.save();
  await booking.populate('room', 'name type roomNumber images price');
  res.json({ success: true, message, ...extra, booking: view(booking) });
};
const LIVE = ['pending', 'confirmed', 'checked_in'];

// Confirm a pending booking
router.put('/:id/status', ...withBooking('bookings.manage', async (req, res, booking) => {
  if (req.body.status !== 'confirmed' || booking.status !== 'pending') return fail(res, 400, 'Chỉ xác nhận được đặt phòng đang chờ xác nhận.');
  booking.status = 'confirmed';
  log(booking, req.user, 'Xác nhận đặt phòng');
  audit(req, 'booking.confirm', 'booking', booking._id, booking.bookingCode);
  await respond(req, res, booking, 'Đã xác nhận đặt phòng.');
}));

// Edit guest info / guests / requests / dates (re-priced)
router.put('/:id', ...withBooking('bookings.manage', async (req, res, booking) => {
  const { guestInfo, guests, specialRequests, checkIn, checkOut, source } = req.body;
  if (!LIVE.includes(booking.status)) return fail(res, 400, 'Không thể sửa đặt phòng đã đóng.');
  // Once the guest is in house only contact / ID details can change (use extend / change-room for the rest)
  if (booking.status === 'checked_in' && (checkIn || checkOut || guests || source)) return fail(res, 400, 'Khách đang ở: chỉ sửa được thông tin khách. Dùng Gia hạn hoặc Đổi phòng.');
  if (guestInfo) booking.guestInfo = { ...booking.guestInfo.toObject(), ...guestInfo };
  if (specialRequests) booking.specialRequests = specialRequests;
  if (source && SOURCES.includes(source)) {
    booking.source = source;
    booking.commissionPercent = (await HotelSettings.get()).commissions.get(source) || 0;
  }
  const datesChanged = checkIn || checkOut;
  if (guests) booking.guests = { ...booking.guests.toObject(), ...guests };
  if (datesChanged || guests) {
    const ci = new Date(checkIn || booking.checkIn);
    const co = new Date(checkOut || booking.checkOut);
    if (isNaN(ci) || isNaN(co)) return fail(res, 400, 'Ngày không hợp lệ.');
    if (nightsBetween(ci, co) < 1) return fail(res, 400, 'Ngày trả phòng phải sau ngày nhận phòng.');
    const [type, plan, settings] = await Promise.all([RoomType.findOne({ name: booking.roomType }), RatePlan.findById(booking.ratePlan), HotelSettings.get()]);
    if (plan && nightsBetween(ci, co) < plan.minStay) return fail(res, 400, `Gói giá này yêu cầu ở tối thiểu ${plan.minStay} đêm.`);
    if ((await typeAvailability(booking.roomType, ci, co, booking._id)).free < 1) return fail(res, 409, 'Hạng phòng đã hết phòng trong khoảng thời gian này.');
    if (booking.room && (await roomConflict(booking.room, ci, co, booking._id))) return fail(res, 409, 'Phòng đã được đặt trong khoảng thời gian này.');
    const price = priceStay({ type, plan, checkIn: ci, checkOut: co, adults: booking.guests.adults, children: booking.guests.children, settings });
    Object.assign(booking, { checkIn: ci, checkOut: co, nightlyRates: price.nightly });
    recalc(booking);
  }
  log(booking, req.user, 'Chỉnh sửa đặt phòng');
  audit(req, 'booking.edit', 'booking', booking._id, booking.bookingCode);
  await respond(req, res, booking, 'Cập nhật đặt phòng thành công!');
}));

// Assign (or auto-assign) a physical room of the booked type
router.put('/:id/assign-room', ...withBooking('bookings.manage', async (req, res, booking) => {
  if (!LIVE.includes(booking.status)) return fail(res, 400, 'Không thể gán phòng cho đặt phòng này.');
  let room;
  if (req.body.roomId) {
    room = await Room.findById(req.body.roomId);
    if (!room || room.type !== booking.roomType) return fail(res, 400, 'Phòng không thuộc hạng đã đặt (dùng "Đổi phòng" để đổi hạng).');
    if (room.status !== 'available') return fail(res, 400, 'Phòng đang bảo trì hoặc bị khóa.');
    if (await roomConflict(room._id, booking.checkIn, booking.checkOut, booking._id)) return fail(res, 409, 'Phòng này đã có người đặt trong thời gian này.');
  } else {
    room = await pickRoom(booking);
    if (!room) return fail(res, 409, 'Không còn phòng trống thuộc hạng này.');
  }
  booking.room = room._id;
  log(booking, req.user, `Gán phòng ${room.roomNumber || room.name}`);
  await respond(req, res, booking, `Đã gán phòng ${room.roomNumber || room.name}.`);
}));

router.put('/:id/check-in', ...withBooking('bookings.manage', async (req, res, booking) => {
  if (!['pending', 'confirmed'].includes(booking.status)) return fail(res, 400, 'Đặt phòng không ở trạng thái có thể nhận phòng.');
  if (startOfDay(booking.checkIn) > startOfDay()) return fail(res, 400, 'Chưa đến ngày nhận phòng.');
  const hasId = booking.guestInfo.idNumber || booking.occupants.some((o) => o.idNumber);
  if (!hasId) return fail(res, 400, 'Cần nhập CCCD / hộ chiếu của khách trước khi nhận phòng.');

  let room = booking.room ? await Room.findById(booking.room) : null;
  if (!room) {
    if (req.body.roomId) {
      room = await Room.findById(req.body.roomId);
      if (!room || room.type !== booking.roomType) return fail(res, 400, 'Phòng không thuộc hạng đã đặt.');
      if (await roomConflict(room._id, booking.checkIn, booking.checkOut, booking._id)) return fail(res, 409, 'Phòng này đã có người đặt.');
    } else {
      room = await pickRoom(booking, { cleanOnly: true });
      if (!room) return fail(res, 409, 'Hiện chưa có phòng sạch thuộc hạng này. Hãy chờ buồng phòng dọn xong hoặc chọn phòng khác.');
    }
  }
  if (room.status !== 'available') return fail(res, 400, 'Phòng đang bảo trì hoặc bị khóa.');
  if (room.hkStatus === 'dirty') return fail(res, 400, 'Phòng chưa được dọn xong.');
  if (await Booking.exists({ _id: { $ne: booking._id }, room: room._id, status: 'checked_in' })) return fail(res, 409, 'Phòng đang có khách ở.');

  booking.room = room._id;
  booking.status = 'checked_in';
  booking.actualCheckIn = new Date();
  log(booking, req.user, `Check-in · phòng ${room.roomNumber || room.name}`);
  audit(req, 'booking.checkin', 'booking', booking._id, `${booking.bookingCode} → ${room.roomNumber || room.name}`);
  await respond(req, res, booking, `Check-in thành công! Phòng ${room.roomNumber || room.name}.`);
}));

// Check-out: room goes dirty. Unpaid balance blocks it unless a manager overrides.
router.put('/:id/check-out', ...withBooking('bookings.manage', async (req, res, booking) => {
  if (booking.status !== 'checked_in') return fail(res, 400, 'Khách chưa nhận phòng.');
  const due = A.balance(booking);
  if (due > 0) {
    if (!req.body.allowUnpaid) return fail(res, 400, `Còn phải thu ${vnd(due)}. Hãy thu tiền trước khi check-out.`);
    if (!can(req.user, 'checkout.override')) return fail(res, 403, 'Chỉ quản lý được cho phép check-out khi còn công nợ.');
  }
  booking.status = 'checked_out';
  booking.actualCheckOut = new Date();
  log(booking, req.user, due > 0 ? `Check-out (còn nợ ${vnd(due)})` : 'Check-out');
  await Room.findByIdAndUpdate(booking.room, { hkStatus: 'dirty' });
  audit(req, 'booking.checkout', 'booking', booking._id, `${booking.bookingCode}${due > 0 ? ' · còn nợ ' + vnd(due) : ''}`);
  await respond(req, res, booking, 'Check-out thành công! Phòng đã chuyển sang chờ dọn.');
}));

// Move to another room (possibly another type)
router.put('/:id/change-room', ...withBooking('bookings.manage', async (req, res, booking) => {
  if (!LIVE.includes(booking.status)) return fail(res, 400, 'Không thể đổi phòng cho đặt phòng này.');
  const room = await Room.findById(req.body.roomId);
  if (!room) return fail(res, 404, 'Phòng không tồn tại.');
  if (room.status !== 'available') return fail(res, 400, 'Phòng mới hiện không có sẵn.');
  if (String(room._id) === String(booking.room)) return fail(res, 400, 'Đang ở phòng này rồi.');
  if (booking.status === 'checked_in' && room.hkStatus === 'dirty') return fail(res, 400, 'Phòng mới chưa được dọn.');
  if (await roomConflict(room._id, booking.checkIn, booking.checkOut, booking._id)) return fail(res, 409, 'Phòng mới đã có người đặt trong thời gian này.');
  if (await Booking.exists({ _id: { $ne: booking._id }, room: room._id, status: 'checked_in' })) return fail(res, 409, 'Phòng mới đang có khách ở.');

  const old = booking.room;
  if (room.type !== booking.roomType) {
    if ((await typeAvailability(room.type, booking.checkIn, booking.checkOut, booking._id)).free < 1) return fail(res, 409, 'Hạng phòng mới đã hết phòng.');
    booking.roomType = room.type;
    if (!req.body.keepRate) { // otherwise it is a courtesy move at the original rate
      const [type, plan, settings] = await Promise.all([RoomType.findOne({ name: room.type }), RatePlan.findById(booking.ratePlan), HotelSettings.get()]);
      const price = priceStay({ type, plan, checkIn: booking.checkIn, checkOut: booking.checkOut, adults: booking.guests.adults, children: booking.guests.children, settings });
      booking.nightlyRates = price.nightly;
      recalc(booking);
    }
  }
  booking.room = room._id;
  log(booking, req.user, `Đổi phòng → ${room.roomNumber || room.name}`);
  if (booking.status === 'checked_in' && old) await Room.findByIdAndUpdate(old, { hkStatus: 'dirty' });
  audit(req, 'booking.changeroom', 'booking', booking._id, `${booking.bookingCode} → ${room.roomNumber || room.name}`);
  await respond(req, res, booking, 'Đổi phòng thành công!');
}));

router.put('/:id/extend', ...withBooking('bookings.manage', async (req, res, booking) => {
  if (!LIVE.includes(booking.status)) return fail(res, 400, 'Không thể gia hạn đặt phòng này.');
  const co = new Date(req.body.checkOut);
  if (isNaN(co) || co <= booking.checkOut) return fail(res, 400, 'Ngày trả phòng mới phải sau ngày hiện tại.');
  if ((await typeAvailability(booking.roomType, booking.checkOut, co, booking._id)).free < 1) return fail(res, 409, 'Hạng phòng đã hết phòng trong thời gian gia hạn.');
  if (booking.room && (await roomConflict(booking.room, booking.checkOut, co, booking._id))) return fail(res, 409, 'Phòng đã có người đặt trong thời gian gia hạn.');
  const [type, plan, settings] = await Promise.all([RoomType.findOne({ name: booking.roomType }), RatePlan.findById(booking.ratePlan), HotelSettings.get()]);
  const extra = priceStay({ type, plan, checkIn: booking.checkOut, checkOut: co, adults: booking.guests.adults, children: booking.guests.children, settings });
  booking.nightlyRates = [...booking.nightlyRates, ...extra.nightly];
  booking.checkOut = co;
  recalc(booking);
  log(booking, req.user, `Gia hạn đến ${co.toLocaleDateString('vi-VN')}`);
  audit(req, 'booking.extend', 'booking', booking._id, `${booking.bookingCode} → ${co.toLocaleDateString('vi-VN')}`);
  await respond(req, res, booking, 'Gia hạn thành công!');
}));

// Discount on the room total, capped per role
router.put('/:id/discount', ...withBooking('discount', async (req, res, booking) => {
  const percent = Number(req.body.percent);
  const limit = DISCOUNT_LIMIT[req.user.role] ?? 0;
  if (!(percent >= 0)) return fail(res, 400, 'Mức giảm giá không hợp lệ.');
  if (percent > limit) return fail(res, 403, `Vai trò của bạn chỉ được giảm tối đa ${limit}%.`);
  if (!LIVE.includes(booking.status)) return fail(res, 400, 'Không thể giảm giá cho đặt phòng này.');
  booking.discountPercent = percent;
  booking.discountReason = req.body.reason || '';
  recalc(booking);
  syncPaymentStatus(booking);
  log(booking, req.user, `Giảm giá ${percent}%${req.body.reason ? ' · ' + req.body.reason : ''}`);
  audit(req, 'booking.discount', 'booking', booking._id, `${booking.bookingCode} · ${percent}%`);
  await respond(req, res, booking, 'Đã cập nhật giảm giá.');
}));

// Folio charges
router.post('/:id/charges', ...withBooking('folio.post', async (req, res, booking) => {
  if (booking.status === 'cancelled' || booking.status === 'no_show') return fail(res, 400, 'Đặt phòng đã đóng.');
  const settings = await HotelSettings.get();
  let { label, category, amount } = req.body;
  if (req.body.preset) { // early check-in / late check-out surcharge = % of one night
    const pct = req.body.preset === 'early_checkin' ? settings.earlyCheckInFeePercent : settings.lateCheckOutFeePercent;
    label = req.body.preset === 'early_checkin' ? 'Phụ thu nhận phòng sớm' : 'Phụ thu trả phòng muộn';
    amount = Math.round((booking.pricePerNight * pct) / 100);
    category = 'service';
  }
  if (!label || !(Number(amount) > 0)) return fail(res, 400, 'Vui lòng nhập tên khoản phí và số tiền > 0.');
  const cat = CHARGE_CATEGORIES.includes(category) && category !== 'fee' ? category : 'service';
  booking.charges.push({ label, category: cat, amount: Number(amount), by: req.user.name });
  syncPaymentStatus(booking);
  log(booking, req.user, `Thêm phí: ${label} (${vnd(Number(amount))})`);
  audit(req, 'folio.charge', 'booking', booking._id, `${booking.bookingCode} · ${label} ${vnd(Number(amount))}`);
  await respond(req, res, booking, 'Đã thêm khoản phí.');
}));

router.delete('/:id/charges/:chargeId', ...withBooking('folio.void', async (req, res, booking) => {
  const charge = booking.charges.id(req.params.chargeId);
  if (!charge) return fail(res, 404, 'Không tìm thấy khoản phí.');
  log(booking, req.user, `Hủy phí: ${charge.label} (${vnd(charge.amount)})`);
  audit(req, 'folio.void', 'booking', booking._id, `${booking.bookingCode} · ${charge.label} ${vnd(charge.amount)}`);
  charge.deleteOne();
  syncPaymentStatus(booking);
  await respond(req, res, booking, 'Đã hủy khoản phí.');
}));

// Payments / refunds / deposits
router.post('/:id/payments', ...withBooking('payments.take', async (req, res, booking) => {
  const value = Number(req.body.amount);
  if (!(value > 0)) return fail(res, 400, 'Số tiền phải lớn hơn 0.');
  const r = await recordPayment(req, booking, { amount: value, method: req.body.method, type: req.body.type, purpose: req.body.purpose });
  if (r.error) return fail(res, r.error[0], r.error[1]);
  log(booking, req.user, `${r.kind === 'refund' ? 'Hoàn tiền' : req.body.purpose === 'deposit' ? 'Thu đặt cọc' : 'Thu tiền'}: ${vnd(value)}`);
  audit(req, r.kind === 'refund' ? 'payment.refund' : 'payment.take', 'booking', booking._id, `${booking.bookingCode} · ${vnd(value)} · ${req.body.method || booking.paymentMethod}`);
  await respond(req, res, booking, r.kind === 'refund' ? 'Đã ghi nhận hoàn tiền.' : 'Đã ghi nhận thanh toán.');
}));

// What cancelling would cost right now
router.get('/:id/cancel-preview', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return fail(res, 404, 'Không tìm thấy đặt phòng.');
    if (!can(req.user, 'bookings.cancel') && !isOwner(req.user, booking)) return fail(res, 403, 'Bạn không có quyền.');
    const p = penalty(booking, await HotelSettings.get());
    res.json({ success: true, fee: p.fee, rule: p.rule, suggestedRefund: Math.max(0, A.paidTotal(booking) - A.refundedTotal(booking) - p.fee) });
  } catch (err) {
    serverError(res, err);
  }
});

// Cancel: staff, or the booking's owner. A fee per the rate-plan policy is added unless a manager waives it.
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return fail(res, 404, 'Không tìm thấy đặt phòng.');
    if (!can(req.user, 'bookings.cancel') && !isOwner(req.user, booking)) return fail(res, 403, 'Bạn không có quyền hủy đặt phòng này.');
    if (booking.status === 'cancelled') return fail(res, 400, 'Đặt phòng đã bị hủy.');
    if (!['pending', 'confirmed'].includes(booking.status)) return fail(res, 400, 'Không thể hủy đặt phòng ở trạng thái này.');
    const waive = !!req.body.waiveFee;
    if (waive && !can(req.user, 'cancel.waive')) return fail(res, 403, 'Chỉ quản lý được miễn phí hủy.');
    const p = penalty(booking, await HotelSettings.get());
    const fee = waive ? 0 : p.fee;
    if (fee > 0) booking.charges.push({ label: 'Phí hủy đặt phòng', category: 'fee', amount: fee, by: req.user.name });
    booking.cancellation = { at: new Date(), by: req.user.name, fee, waived: waive };
    booking.status = 'cancelled';
    syncPaymentStatus(booking);
    log(booking, req.user, `Hủy đặt phòng${fee ? ' · phí ' + vnd(fee) : waive ? ' · miễn phí hủy' : ''}`);
    audit(req, 'booking.cancel', 'booking', booking._id, `${booking.bookingCode}${fee ? ' · phí ' + vnd(fee) : ''}`);
    await booking.save();
    res.json({
      success: true, message: fee ? `Đã hủy. Phí hủy: ${vnd(fee)}.` : 'Hủy đặt phòng thành công!',
      fee, suggestedRefund: Math.max(0, A.paidTotal(booking) - A.refundedTotal(booking) - fee), booking: view(booking)
    });
  } catch (err) {
    serverError(res, err);
  }
});

// Guest did not arrive: charge per policy, release the room
router.put('/:id/no-show', ...withBooking('bookings.manage', async (req, res, booking) => {
  if (!['pending', 'confirmed'].includes(booking.status)) return fail(res, 400, 'Chỉ đánh dấu no-show cho đặt phòng chưa nhận phòng.');
  if (startOfDay(booking.checkIn) > startOfDay()) return fail(res, 400, 'Chưa đến ngày nhận phòng.');
  const waive = !!req.body.waiveFee;
  if (waive && !can(req.user, 'cancel.waive')) return fail(res, 403, 'Chỉ quản lý được miễn phí no-show.');
  const fee = waive ? 0 : penalty(booking, await HotelSettings.get(), new Date(8.64e15)).fee; // always past the free window
  if (fee > 0) booking.charges.push({ label: 'Phí no-show', category: 'fee', amount: fee, by: req.user.name });
  booking.status = 'no_show';
  syncPaymentStatus(booking);
  log(booking, req.user, `No-show${fee ? ' · phí ' + vnd(fee) : ''}`);
  audit(req, 'booking.noshow', 'booking', booking._id, booking.bookingCode);
  await respond(req, res, booking, fee ? `Đã ghi nhận no-show. Phí: ${vnd(fee)}.` : 'Đã ghi nhận no-show.');
}));

// Occupants (ID details) and temporary-residence registration
router.put('/:id/occupants', ...withBooking(['bookings.manage', 'residence'], async (req, res, booking) => {
  if (!Array.isArray(req.body.occupants)) return fail(res, 400, 'Danh sách khách lưu trú không hợp lệ.');
  booking.occupants = req.body.occupants;
  log(booking, req.user, 'Cập nhật thông tin khách lưu trú');
  await respond(req, res, booking, 'Đã lưu thông tin khách lưu trú.');
}));

router.put('/:id/residence', ...withBooking('residence', async (req, res, booking) => {
  const done = req.body.registered !== false;
  booking.residence = { registered: done, at: done ? new Date() : undefined, by: done ? req.user.name : undefined };
  log(booking, req.user, done ? 'Đã khai báo lưu trú' : 'Hủy đánh dấu khai báo lưu trú');
  audit(req, 'residence', 'booking', booking._id, booking.bookingCode);
  await respond(req, res, booking, done ? 'Đã đánh dấu khai báo lưu trú.' : 'Đã bỏ đánh dấu.');
}));

// Invoice with tax lines, plus a room / extras split for companies that pay the room only
router.get('/:id/invoice', protect, async (req, res) => {
  try {
    const booking = await populateFull(Booking.findById(req.params.id));
    if (!booking) return fail(res, 404, 'Không tìm thấy đặt phòng.');
    if (!can(req.user, 'bookings.view') && !isOwner(req.user, booking)) return fail(res, 403, 'Bạn không có quyền xem hóa đơn này.');
    const settings = await HotelSettings.get();
    const part = (net) => {
      const svc = Math.round((net * (booking.serviceChargeRate || 0)) / 100);
      const v = Math.round(((net + svc) * (booking.vatRate || 0)) / 100);
      return { net, service: svc, vat: v, total: net + svc + v };
    };
    const m = money(booking);
    const bank = settings.bank?.bankCode && settings.bank?.accountNo ? settings.bank : null;
    res.json({
      success: true,
      invoice: {
        hotel: { name: settings.name, address: settings.address, phone: settings.phone, taxCode: settings.taxCode },
        bookingCode: booking.bookingCode,
        guest: booking.guestInfo,
        room: { name: booking.room?.name, roomNumber: booking.room?.roomNumber, type: booking.roomType },
        ratePlan: booking.ratePlanName,
        checkIn: booking.checkIn, checkOut: booking.checkOut, nights: booking.nights,
        pricePerNight: booking.pricePerNight, discountPercent: booking.discountPercent,
        vatRate: booking.vatRate, serviceChargeRate: booking.serviceChargeRate,
        charges: booking.charges,
        roomTotal: m.room, extras: m.extras, fees: m.fees, service: m.service, vat: m.vat, grand: m.grand,
        paid: m.paid, refunded: m.refunded, balance: m.balance,
        split: { room: part(m.room), extras: part(m.extras) },
        payments: booking.payments,
        qr: bank && m.balance > 0
          ? `https://img.vietqr.io/image/${bank.bankCode}-${bank.accountNo}-compact.png?amount=${m.balance}&addInfo=${encodeURIComponent(booking.bookingCode)}&accountName=${encodeURIComponent(bank.accountName)}`
          : null,
        issuedAt: new Date()
      }
    });
  } catch (err) {
    serverError(res, err);
  }
});

module.exports = router;
