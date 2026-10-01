// Demo data for the admin area: physical rooms with numbers, ~3 months of bookings, charges,
// payments, expenses and staff accounts. Safe to re-run (replaces its own demo bookings/expenses).
//   npm run seed:demo
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const Expense = require('../models/Expense');
const User = require('../models/User');
const RoomType = require('../models/RoomType');
const RatePlan = require('../models/RatePlan');
const HotelSettings = require('../models/HotelSettings');
const NightAudit = require('../models/NightAudit');
const AuditLog = require('../models/AuditLog');
const Shift = require('../models/Shift');
const A = require('./analytics');
const { priceStay } = require('./pricing');
const { penalty } = require('./policy');

const { startOfDay, addDays, dayKey } = A;

// Small deterministic PRNG so every run produces the same data
let seed = 20261001;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (a) => a[Math.floor(rand() * a.length)];
const between = (a, b) => a + Math.floor(rand() * (b - a + 1));

const GUESTS = [
  ['Nguyễn Văn An', 'Việt Nam'], ['Trần Thị Bình', 'Việt Nam'], ['Lê Hoàng Cường', 'Việt Nam'], ['Phạm Thu Dung', 'Việt Nam'],
  ['Hoàng Minh Đức', 'Việt Nam'], ['Vũ Thị Hà', 'Việt Nam'], ['Đặng Quốc Huy', 'Việt Nam'], ['Bùi Thanh Hương', 'Việt Nam'],
  ['Ngô Gia Khánh', 'Việt Nam'], ['Đỗ Thị Lan', 'Việt Nam'], ['Dương Tuấn Long', 'Việt Nam'], ['Lý Mỹ Linh', 'Việt Nam'],
  ['Phan Văn Nam', 'Việt Nam'], ['Trương Thị Oanh', 'Việt Nam'], ['Võ Anh Phong', 'Việt Nam'], ['Mai Thị Quỳnh', 'Việt Nam'],
  ['Tạ Đình Sơn', 'Việt Nam'], ['Hồ Thị Thảo', 'Việt Nam'], ['Cao Văn Tùng', 'Việt Nam'], ['Lương Thị Uyên', 'Việt Nam'],
  ['John Smith', 'Mỹ'], ['Emma Wilson', 'Anh'], ['Kim Min-jun', 'Hàn Quốc'], ['Park Seo-yeon', 'Hàn Quốc'],
  ['Tanaka Hiroshi', 'Nhật Bản'], ['Sato Yuki', 'Nhật Bản'], ['Michael Chen', 'Singapore'], ['Sophie Martin', 'Pháp'],
  ['Hans Müller', 'Đức'], ['Olivia Brown', 'Úc']
].map(([name, nationality], i) => ({
  name, nationality,
  email: `khach${i + 1}@example.com`,
  phone: `09${String(10000000 + i * 137531).slice(0, 8)}`,
  idNumber: nationality === 'Việt Nam' ? `0${String(79000000000 + i * 7919).slice(0, 11)}` : `P${String(5000000 + i * 311)}`
}));
// Personas: guest 0 loves weekends in sea-view rooms; guest 1 stays often; guest 2 stopped coming
const WEEKEND_GUEST = 0;
const LOYAL_GUEST = 1;
const LAPSED_GUEST = 2;

const CHARGES = [
  ['Massage & Spa', 'spa', [450000, 1500000]], ['Giặt ủi', 'laundry', [80000, 250000]], ['Đưa đón sân bay', 'transport', [300000, 600000]],
  ['Minibar', 'minibar', [100000, 350000]], ['Nhà hàng', 'food', [300000, 1200000]], ['Buffet sáng thêm', 'food', [150000, 400000]]
];
const SOURCE_MIX = ['website', 'website', 'website', 'booking_com', 'booking_com', 'agoda', 'traveloka', 'expedia', 'airbnb', 'walk_in', 'phone'];

const run = async () => {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to seed demo data in production.');
  await mongoose.connect(process.env.MONGODB_URI);
  if (!(await Room.countDocuments())) await require('./seeder')();
  await require('./migrate')();

  // 1. Hotel settings
  const settings = await HotelSettings.get();
  settings.address = settings.address || '12 Phố Huế, Hai Bà Trưng, Hà Nội';
  settings.phone = settings.phone || '024 3999 8888';
  settings.email = settings.email || 'info@lumistay.vn';
  settings.taxCode = settings.taxCode || '0109999999';
  settings.weekendSurchargePercent = 10;
  settings.bank = settings.bank?.bankCode ? settings.bank : { bankCode: 'VCB', accountNo: '0011004567890', accountName: 'CTY TNHH LUMISTAY' };
  const y = new Date().getFullYear();
  settings.seasons = [
    { name: 'Lễ Quốc khánh', from: new Date(y, 7, 30), to: new Date(y, 8, 3), adjustPercent: 25 },
    { name: 'Cuối năm', from: new Date(y, 11, 20), to: new Date(y + 1, 0, 5), adjustPercent: 20 }
  ];
  await settings.save();

  // 2. Staff accounts
  for (const [name, email, password, role] of [
    ['Quản lý Mai', 'manager@lumistay.com', 'manager123', 'manager'],
    ['Lễ tân Hoa', 'letan@lumistay.com', 'letan123', 'receptionist'],
    ['Buồng phòng Lan', 'hk1@lumistay.com', 'hk123456', 'housekeeping'],
    ['Buồng phòng Thu', 'hk2@lumistay.com', 'hk123456', 'housekeeping'],
    ['Thu ngân Minh', 'thungan@lumistay.com', 'thungan123', 'cashier'],
    ['Kế toán Hạnh', 'ketoan@lumistay.com', 'ketoan123', 'accountant'],
    ['Sales Dũng', 'sales@lumistay.com', 'sales123', 'sales']
  ]) if (!(await User.findOne({ email }))) await User.create({ name, email, password, role });
  const housekeepers = await User.find({ role: 'housekeeping' });
  const frontDesk = await User.findOne({ email: 'letan@lumistay.com' });

  // 3. Physical rooms: 3 floors x 8 rooms. Base (website) rooms take the first slot of their type,
  //    the rest are hidden clones (listed:false) so the public site isn't flooded with duplicates.
  const templates = await Room.find({ listed: { $ne: false } }).sort({ createdAt: 1 });
  const slots = [];
  for (const floor of [3, 4, 5]) for (let i = 1; i <= 8; i++) slots.push({ floor, number: `${floor}0${i}` });
  const used = new Set((await Room.find({ roomNumber: { $exists: true } }).select('roomNumber')).map((r) => r.roomNumber));
  const claimed = new Set();
  slots.forEach((slot, idx) => { if (!used.has(slot.number)) slot.template = templates[idx % templates.length]; });
  for (const slot of slots) {
    if (!slot.template) continue;
    const t = slot.template;
    if (!t.roomNumber && !claimed.has(String(t._id))) {
      t.roomNumber = slot.number; t.floor = slot.floor;
      await t.save();
      claimed.add(String(t._id));
    } else {
      const { _id, __v, roomNumber, createdAt, ...rest } = t.toObject();
      await Room.create({ ...rest, roomNumber: slot.number, floor: slot.floor, listed: false, isFeatured: false });
    }
  }
  await Room.updateMany({}, { status: 'available', hkStatus: 'clean', $unset: { assignedTo: 1 } });
  const rooms = await Room.find({ roomNumber: { $exists: true } }).sort({ roomNumber: 1 });
  rooms[rooms.length - 1].status = 'maintenance'; // not offered for bookings from -3 days on
  rooms[rooms.length - 2].status = 'locked';
  await Promise.all(rooms.slice(-2).map((r) => r.save()));

  // 4. Bookings, room by room
  const types = Object.fromEntries((await RoomType.find()).map((t) => [t.name, t]));
  const plans = await RatePlan.find();
  const plan = (code) => plans.find((p) => p.code === code);
  await Promise.all([
    Booking.deleteMany({ 'guestInfo.note': 'demo' }), Expense.deleteMany({ note: 'demo' }),
    NightAudit.deleteMany({ runBy: 'Dữ liệu demo' }), AuditLog.deleteMany({ role: 'demo' }), Shift.deleteMany({ note: 'demo' })
  ]);
  const today = startOfDay();
  const docs = [];
  let n = 1;
  for (const room of rooms) {
    const blocked = ['maintenance', 'locked'].includes(room.status);
    const type = types[room.type];
    let cursor = addDays(today, -150);
    const lastDay = addDays(today, blocked ? -3 : 21);
    while (cursor < lastDay) {
      const dow = cursor.getDay();
      let p = [5, 6].includes(dow) ? 0.85 : dow === 0 ? 0.5 : 0.35;
      // Demo storyline: Deluxe demand dips in the last week
      if (room.type === 'Deluxe' && cursor >= addDays(today, -7) && cursor <= today) p *= 0.3;
      if (cursor > today) p *= 0.75; // fewer bookings made so far for later dates
      if (rand() > p) { cursor = addDays(cursor, 1); continue; }

      const weekendGuest = [5, 6].includes(dow) && /biển|ocean|sea/i.test(room.name) && rand() < 0.12;
      let g = weekendGuest ? GUESTS[WEEKEND_GUEST] : GUESTS[Math.min(GUESTS.length - 1, Math.floor(Math.pow(rand(), 1.2) * GUESTS.length))];
      if (g === GUESTS[LAPSED_GUEST] && cursor > addDays(today, -125)) g = GUESTS[LOYAL_GUEST]; // lapsed guest: last seen > 120 days ago
      const nights = weekendGuest ? 2 : between(1, 4);
      const checkIn = cursor;
      const checkOut = addDays(cursor, nights);
      cursor = addDays(checkOut, rand() < 0.5 ? 0 : 1);

      const pr = rand();
      const rp = plan(pr < 0.55 ? 'BAR' : pr < 0.75 ? 'BB' : pr < 0.9 ? 'NRF' : 'CORP');
      const nights2 = Math.max(nights, rp.minStay);
      const source = rp.code === 'CORP' ? 'corporate' : pick(SOURCE_MIX);
      const adults = between(1, Math.min(type.maxAdults, 3));
      const children = rand() < 0.2 ? 1 : 0;
      const price = priceStay({ type, plan: rp, checkIn, checkOut: addDays(checkIn, nights2), adults, children, settings });
      const discountPercent = rand() < 0.08 ? pick([5, 10]) : 0;
      const createdAt = new Date(Math.min(addDays(checkIn, -between(1, 21)).getTime(), Date.now() - 3600e3));
      const method = pick(['cash', 'card', 'transfer', 'online']);

      const doc = {
        bookingCode: `LSD${String(n++).padStart(6, '0')}`,
        roomType: room.type, room: room._id, ratePlan: rp._id, ratePlanName: rp.name,
        policy: { nonRefundable: rp.nonRefundable, freeCancelHours: rp.freeCancelHours, penaltyNights: rp.penaltyNights, depositPercent: rp.depositPercent },
        guestInfo: { name: g.name, email: g.email, phone: g.phone, idNumber: g.idNumber, nationality: g.nationality, note: 'demo' },
        checkIn, checkOut: addDays(checkIn, nights2), nights: nights2,
        guests: { adults, children },
        nightlyRates: price.nightly, pricePerNight: Math.round(price.average),
        discountPercent, discountReason: discountPercent ? 'Khách quen' : '',
        totalPrice: Math.round(price.total * (1 - discountPercent / 100)),
        vatRate: settings.vatRate, serviceChargeRate: settings.serviceChargeRate,
        paymentMethod: method, source, commissionPercent: settings.commissions.get(source) || 0,
        charges: [], payments: [], createdAt, updatedAt: createdAt,
        history: [{ action: 'Dữ liệu demo', by: 'Hệ thống', at: createdAt }]
      };
      const checkOutD = doc.checkOut;

      // Outcome
      const cancelled = rand() < 0.06 && checkIn > addDays(today, -60);
      const noShow = !cancelled && checkIn < today && rand() < 0.02;
      if (cancelled) doc.status = 'cancelled';
      else if (noShow) doc.status = 'no_show';
      else if (checkOutD <= today) doc.status = 'checked_out';
      else if (checkIn <= today) doc.status = 'checked_in';
      else doc.status = rand() < 0.7 ? 'confirmed' : 'pending';

      // Future stays beyond tomorrow have no room yet (assigned at check-in)
      if (checkIn > addDays(today, 1) && rand() < 0.6) delete doc.room;

      // Extra charges
      if (['checked_in', 'checked_out'].includes(doc.status) && rand() < 0.65) {
        for (let k = between(1, 3); k > 0; k--) {
          const [label, category, [lo, hi]] = pick(CHARGES);
          const at = addDays(checkIn, between(0, nights2 - 1));
          if (at <= new Date()) doc.charges.push({ label, category, amount: Math.round(between(lo, hi) / 10000) * 10000, at, by: frontDesk.name });
        }
      }

      // Cancellation / no-show fees
      if (cancelled) {
        const cancelAt = addDays(checkIn, -between(0, 6));
        const fee = Math.round(penalty(doc, settings, cancelAt).fee);
        doc.cancellation = { at: cancelAt, by: frontDesk.name, fee, waived: false };
        if (fee > 0) doc.charges.push({ label: 'Phí hủy đặt phòng', category: 'fee', amount: fee, at: cancelAt, by: frontDesk.name });
      } else if (noShow) {
        const fee = Math.round(penalty(doc, settings, new Date(8.64e15)).fee);
        if (fee > 0) doc.charges.push({ label: 'Phí no-show', category: 'fee', amount: fee, at: checkIn, by: 'Chốt ngày' });
      }

      // Payments (deposit at booking, rest at check-out)
      const grand = A.grandTotal(doc);
      const by = frontDesk.name;
      const dep = (pctOfGrand, at) => doc.payments.push({ type: 'payment', purpose: 'deposit', amount: Math.round(grand * pctOfGrand), method, at, by });
      if (doc.status === 'checked_out') {
        if (rp.nonRefundable) dep(1, createdAt);
        else { if (rand() < 0.4) dep(0.3, createdAt); }
        const paid = A.paidTotal(doc);
        if (grand - paid > 0) doc.payments.push({ type: 'payment', purpose: 'settlement', amount: grand - paid, method, at: checkOutD, by });
      } else if (doc.status === 'checked_in') {
        if (rp.nonRefundable) dep(1, createdAt); else dep(0.3, checkIn);
      } else if (doc.status === 'confirmed' || doc.status === 'pending') {
        if (rp.nonRefundable) dep(1, createdAt); else if (rand() < 0.5) dep(0.3, createdAt);
      } else if (cancelled || noShow) {
        if (rp.nonRefundable || rand() < 0.5) dep(rp.nonRefundable ? 1 : 0.3, createdAt);
        const fee = A.feesTotal(doc);
        const paid = A.paidTotal(doc);
        if (paid > fee) doc.payments.push({ type: 'refund', purpose: 'settlement', amount: paid - fee, method, at: doc.cancellation?.at || checkIn, by });
        else if (fee > paid) doc.payments.push({ type: 'payment', purpose: 'settlement', amount: fee - paid, method, at: checkIn, by });
      }
      A.syncPaymentStatus(doc);

      if (['checked_in', 'checked_out'].includes(doc.status)) {
        doc.actualCheckIn = checkIn;
        if (doc.status === 'checked_out') doc.actualCheckOut = checkOutD;
        doc.occupants = [{ name: g.name, idType: g.nationality === 'Việt Nam' ? 'cccd' : 'passport', idNumber: g.idNumber, nationality: g.nationality, gender: '' }];
        doc.residence = rand() < (doc.status === 'checked_in' ? 0.6 : 0.95) ? { registered: true, at: checkIn, by: frontDesk.name } : { registered: false };
      }
      docs.push(doc);
    }
  }

  // A few first-time guests with a single recent booking ("khách mới")
  docs.filter((d) => !['cancelled', 'no_show'].includes(d.status) && d.createdAt > addDays(today, -30)).slice(0, 4).forEach((d, i) => {
    d.guestInfo = { name: `Khách mới ${i + 1}`, email: `moi${i + 1}@example.com`, phone: `0988000${i}00`, idNumber: '', nationality: 'Việt Nam', note: 'demo' };
  });
  // The most recent in-house booking lacks an ID: shows up in the residence screen
  const noId = docs.filter((d) => d.status === 'checked_in').slice(-2);
  noId.forEach((d) => { d.guestInfo.idNumber = ''; d.occupants = []; d.residence = { registered: false }; });
  await Booking.insertMany(docs, { lean: true });

  // 5. Housekeeping state
  const dirtyIds = new Set();
  const outToday = await Booking.find({ checkOut: { $gte: today, $lt: addDays(today, 1) }, status: 'checked_out' }).select('room');
  outToday.forEach((b) => dirtyIds.add(String(b.room)));
  const inHouse = await Booking.find({ status: 'checked_in' }).select('room');
  inHouse.forEach((b) => rand() < 0.35 && dirtyIds.add(String(b.room)));
  let hk = 0;
  for (const r of rooms) {
    const dirty = dirtyIds.has(String(r._id));
    r.hkStatus = dirty ? 'dirty' : rand() < 0.4 ? 'inspected' : 'clean';
    if (dirty) r.assignedTo = housekeepers[hk++ % housekeepers.length]?._id;
    await r.save();
  }

  // 6. Guest directory
  const vip = { 0: 'platinum', 1: 'gold', 3: 'gold', 5: 'silver' };
  for (const [i, g] of GUESTS.entries()) {
    await Customer.findOneAndUpdate({ email: g.email }, {
      name: g.name, phone: g.phone, idNumber: g.idNumber, nationality: g.nationality,
      notes: i === WEEKEND_GUEST ? 'Thích tầng cao, yên tĩnh.' : '',
      vipLevel: vip[i] || 'none', dob: new Date(1970 + (i * 7) % 30, i % 12, 1 + (i * 3) % 27),
      preferences: i === WEEKEND_GUEST ? 'Gối cao, không hút thuốc, phòng hướng biển' : '', marketingConsent: i % 3 === 0,
      blacklisted: g.name === 'Hans Müller', blacklistReason: g.name === 'Hans Müller' ? 'Làm hỏng tài sản phòng, từ chối bồi thường' : ''
    }, { upsert: true });
  }

  // 7. Expenses
  const exps = [];
  for (let m = 0; m < 3; m++) {
    const d = (day) => new Date(today.getFullYear(), today.getMonth() - m, day);
    exps.push(
      { title: 'Lương nhân viên', category: 'Lương', amount: 85000000, date: d(5) },
      { title: 'Điện nước', category: 'Điện nước', amount: between(20, 26) * 1000000, date: d(8) },
      { title: 'Vật tư buồng phòng', category: 'Vật tư', amount: between(9, 14) * 1000000, date: d(12) },
      { title: 'Quảng cáo Facebook/Google', category: 'Marketing', amount: 8000000, date: d(15) },
      { title: 'Bảo trì điều hòa', category: 'Bảo trì', amount: between(4, 8) * 1000000, date: d(20) }
    );
  }
  await Expense.insertMany(exps.filter((e) => e.date <= new Date()).map((e) => ({ ...e, note: 'demo' })));

  // 8. Night audits for the last 10 days (so today is the next business date), cashier shifts, audit trail
  const sellable = await A.sellableRooms();
  for (let i = 10; i >= 1; i--) {
    const d = addDays(today, -i);
    const dEnd = addDays(d, 1);
    const [day] = A.buildDaily(await A.loadBookings(d, dEnd), d, dEnd);
    const k = A.kpis([day], sellable);
    const payments = {};
    for (const b of docs) for (const p of b.payments) if (p.at >= d && p.at < dEnd) payments[p.method] = (payments[p.method] || 0) + (p.type === 'refund' ? -p.amount : p.amount);
    await NightAudit.create({
      date: dayKey(d), runBy: 'Dữ liệu demo', runAt: addDays(d, 1), inHouse: day.occupied, payments,
      noShows: docs.filter((b) => b.status === 'no_show' && dayKey(b.checkIn) === dayKey(d)).length,
      figures: { sold: k.sold, available: k.available, occupancy: k.occupancy, adr: k.adr, revpar: k.revpar, roomRevenue: k.roomRevenue, serviceRevenue: k.serviceRevenue, foodRevenue: k.foodRevenue, totalRevenue: k.totalRevenue }
    });
  }
  for (let i = 4; i >= 1; i--) {
    const opened = addDays(today, -i); opened.setHours(7, 0, 0, 0);
    const expected = 2000000 + between(3, 20) * 500000;
    const variance = pick([0, 0, 0, -50000, 20000]);
    await Shift.create({ user: frontDesk._id, userName: frontDesk.name, openedAt: opened, closedAt: new Date(opened.getTime() + 8 * 3600e3), openingCash: 2000000, expectedCash: expected, countedCash: expected + variance, variance, status: 'closed', note: 'demo' });
  }
  const sample = [
    ['booking.checkin', 'booking', 'LSD000900 → 405', frontDesk], ['booking.discount', 'booking', 'LSD000812 · 10%', frontDesk],
    ['roomtype.edit', 'roomtype', 'Deluxe · giá 1.900.000 → 2.000.000', await User.findOne({ email: 'manager@lumistay.com' })],
    ['room.status', 'room', '508 → maintenance', await User.findOne({ email: 'manager@lumistay.com' })]
  ];
  for (const [action, entity, summary, u] of sample) {
    await AuditLog.create({ at: addDays(new Date(), -between(0, 3)), user: u._id, userName: u.name, role: 'demo', action, entity, summary });
  }

  console.log(`✅ Demo: ${rooms.length} phòng, ${docs.length} đặt phòng, ${exps.length} khoản chi.`);
  console.log('   Tài khoản: admin@lumistay.com/admin123456 · manager@lumistay.com/manager123 · letan@lumistay.com/letan123');
  console.log('   hk1@lumistay.com/hk123456 · thungan@lumistay.com/thungan123 · ketoan@lumistay.com/ketoan123 · sales@lumistay.com/sales123');
  await mongoose.disconnect();
};

run().catch((e) => { console.error(e); process.exit(1); });
