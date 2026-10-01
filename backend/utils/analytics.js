const Booking = require('../models/Booking');
const Room = require('../models/Room');

const DAY = 24 * 60 * 60 * 1000;
const ACTIVE = ['pending', 'confirmed', 'checked_in'];          // holds inventory
const REVENUE = ['confirmed', 'checked_in', 'checked_out'];     // earns room revenue (pending isn't revenue yet)
const NO_STAY = ['cancelled', 'no_show'];

const startOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
const sum = (arr, f = (x) => x) => arr.reduce((a, x) => a + f(x), 0);
const round = Math.round;

// ───────────── Money for one booking ─────────────
// Rates are exclusive of tax: net = room (after discount) + extras; service charge on net; VAT on net + service.
// Fees (cancellation / no-show) are outside the tax base.
const isFee = (c) => c.category === 'fee';
const bucket = (c) => (['food', 'minibar'].includes(c.category) ? 'food' : 'service');
const roomTotal = (b) => b.totalPrice;
const extrasTotal = (b) => sum((b.charges || []).filter((c) => !isFee(c)), (c) => c.amount);
const feesTotal = (b) => sum((b.charges || []).filter(isFee), (c) => c.amount);
const chargesTotal = (b) => extrasTotal(b) + feesTotal(b);
const taxableBase = (b) => roomTotal(b) + extrasTotal(b);
const serviceCharge = (b) => round((taxableBase(b) * (b.serviceChargeRate || 0)) / 100);
const vat = (b) => round(((taxableBase(b) + serviceCharge(b)) * (b.vatRate || 0)) / 100);
const grandTotal = (b) => taxableBase(b) + serviceCharge(b) + vat(b) + feesTotal(b);
const paidTotal = (b) => sum((b.payments || []).filter((p) => p.type === 'payment'), (p) => p.amount);
const refundedTotal = (b) => sum((b.payments || []).filter((p) => p.type === 'refund'), (p) => p.amount);
const balance = (b) => Math.max(0, grandTotal(b) - (paidTotal(b) - refundedTotal(b)));

// Keep paymentStatus consistent with the payments ledger
const syncPaymentStatus = (b) => {
  const paid = paidTotal(b);
  const refunded = refundedTotal(b);
  if (refunded > 0 && refunded >= paid) b.paymentStatus = 'refunded';
  else if (paid - refunded >= grandTotal(b) && paid > 0) b.paymentStatus = 'paid';
  else b.paymentStatus = 'unpaid';
};

// Net room rate of night `i` after the booking's discount
const nightRate = (b, i) => ((b.nightlyRates && b.nightlyRates[i]) ?? b.pricePerNight) * (1 - (b.discountPercent || 0) / 100);
const typeOf = (b) => b.roomType || b.room?.type || 'Khác';

// Bookings that have at least one night inside [from, to) (cancelled / no-show included: they may carry fees)
const loadBookings = (from, to, statuses) => {
  const q = { checkIn: { $lt: to }, checkOut: { $gt: from } };
  if (statuses) q.status = { $in: statuses };
  return Booking.find(q).populate('room', 'name type roomNumber price').lean();
};

// Per-day figures for [from, to): rooms held / sold, revenue split, revenue by room type / room.
// Room revenue is attributed night by night; extra charges to the day they were posted.
const buildDaily = (bookings, from, to) => {
  const days = {};
  for (let d = startOfDay(from); d < to; d = addDays(d, 1)) {
    days[dayKey(d)] = { date: dayKey(d), occupied: 0, sold: 0, roomRevenue: 0, serviceRevenue: 0, foodRevenue: 0, byType: {}, byRoom: {} };
  }
  for (const b of bookings) {
    const type = typeOf(b);
    const roomName = b.room ? (b.room.roomNumber ? `${b.room.roomNumber} · ${b.room.name}` : b.room.name) : 'Chưa gán phòng';
    const earns = REVENUE.includes(b.status);
    if (!NO_STAY.includes(b.status)) {
      let i = 0;
      for (let d = startOfDay(b.checkIn); d < b.checkOut; d = addDays(d, 1), i++) {
        const day = days[dayKey(d)];
        if (!day) continue;
        day.occupied += 1;
        if (earns) {
          const r = nightRate(b, i);
          day.sold += 1;
          day.roomRevenue += r;
          day.byType[type] = (day.byType[type] || 0) + r;
          day.byRoom[roomName] = (day.byRoom[roomName] || 0) + r;
        }
      }
    }
    // extra charges: normal stays earn all of them, cancelled / no-show bookings only their fees
    for (const c of b.charges || []) {
      if (!earns && !isFee(c)) continue;
      const day = days[dayKey(c.at)];
      if (!day) continue;
      day[bucket(c) === 'food' ? 'foodRevenue' : 'serviceRevenue'] += c.amount;
      day.byType[type] = (day.byType[type] || 0) + c.amount;
      day.byRoom[roomName] = (day.byRoom[roomName] || 0) + c.amount;
    }
  }
  return Object.values(days).map((d) => ({ ...d, revenue: d.roomRevenue + d.serviceRevenue + d.foodRevenue }));
};

// Rooms that can be sold (not out of order)
const sellableRooms = () => Room.countDocuments({ status: 'available' });

// Physical + derived status of every room, for the floor plan.
// Priority: out of order > occupied > dirty > reserved > available.
const roomBoard = async (now = new Date()) => {
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  const [rooms, bookings] = await Promise.all([
    Room.find().sort({ floor: -1, roomNumber: 1, name: 1 }).populate('assignedTo', 'name').lean(),
    Booking.find({ status: { $in: ACTIVE }, room: { $exists: true, $ne: null }, checkIn: { $lt: tomorrow }, checkOut: { $gt: today } })
      .select('room status checkIn checkOut guestInfo.name bookingCode').lean()
  ]);
  const byRoom = {};
  for (const b of bookings) (byRoom[b.room] ||= []).push(b);
  return rooms.map((r) => {
    const list = byRoom[r._id] || [];
    const inHouse = list.find((b) => b.status === 'checked_in');
    const reserved = list.find((b) => b.status !== 'checked_in');
    let displayStatus = 'available';
    if (r.status !== 'available') displayStatus = r.status;
    else if (inHouse) displayStatus = 'occupied';
    else if (r.hkStatus === 'dirty') displayStatus = 'cleaning'; // vacant dirty
    else if (reserved) displayStatus = 'reserved';
    return { ...r, displayStatus, currentBooking: inHouse || reserved || null };
  });
};

// KPI block (occupancy, ADR, RevPAR) for a list of daily rows
const kpis = (daily, roomsAvailable) => {
  const sold = sum(daily, (d) => d.sold);
  const available = roomsAvailable * daily.length;
  const roomRevenue = sum(daily, (d) => d.roomRevenue);
  const totalRevenue = sum(daily, (d) => d.revenue);
  return {
    sold, available,
    occupancy: available ? sold / available : 0,
    adr: sold ? roomRevenue / sold : 0,
    revpar: available ? roomRevenue / available : 0,
    trevpar: available ? totalRevenue / available : 0,
    roomRevenue,
    serviceRevenue: sum(daily, (d) => d.serviceRevenue),
    foodRevenue: sum(daily, (d) => d.foodRevenue),
    totalRevenue
  };
};

module.exports = {
  DAY, ACTIVE, REVENUE, NO_STAY, startOfDay, addDays, dayKey, sum,
  roomTotal, extrasTotal, feesTotal, chargesTotal, taxableBase, serviceCharge, vat, grandTotal,
  paidTotal, refundedTotal, balance, syncPaymentStatus, nightRate, typeOf, bucket, isFee,
  loadBookings, buildDaily, sellableRooms, roomBoard, kpis
};
