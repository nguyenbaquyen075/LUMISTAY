const Booking = require('../models/Booking');
const Room = require('../models/Room');
const RoomType = require('../models/RoomType');
const RatePlan = require('../models/RatePlan');
const { ACTIVE, startOfDay, addDays, dayKey, DAY } = require('./analytics');

const nightsBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / DAY);
const roundK = (n) => Math.round(n / 1000) * 1000;

// Price every night of a stay: type base × season × weekend × plan, plus extra person / child fees.
const priceStay = ({ type, plan, checkIn, checkOut, adults = 1, children = 0, settings }) => {
  const nights = nightsBetween(checkIn, checkOut);
  const extraAdults = Math.max(0, adults - type.baseAdults) * type.extraAdultFee;
  const paidChildren = Math.max(0, children - type.freeChildren) * type.childFee;
  const nightly = [];
  for (let i = 0; i < nights; i++) {
    const d = addDays(startOfDay(checkIn), i);
    const key = dayKey(d);
    const season = (settings.seasons || []).find((s) => dayKey(s.from) <= key && key <= dayKey(s.to));
    const weekend = [5, 6].includes(d.getDay()) ? settings.weekendSurchargePercent || 0 : 0; // Fri & Sat nights
    const rate = type.basePrice * (1 + (season?.adjustPercent || 0) / 100) * (1 + weekend / 100) * (1 + (plan?.adjustPercent || 0) / 100);
    nightly.push(roundK(rate) + extraAdults + paidChildren);
  }
  const total = nightly.reduce((a, b) => a + b, 0);
  return { nights, nightly, total, average: nights ? total / nights : 0 };
};

// Rooms of a type still free on every night of [checkIn, checkOut): sellable rooms minus the peak number of overlapping bookings
const typeAvailability = async (typeName, checkIn, checkOut, excludeId) => {
  const [total, bookings] = await Promise.all([
    Room.countDocuments({ type: typeName, status: 'available' }),
    Booking.find({ _id: { $ne: excludeId }, roomType: typeName, status: { $in: ACTIVE }, checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } })
      .select('checkIn checkOut').lean()
  ]);
  let peak = 0;
  for (let d = startOfDay(checkIn); d < checkOut; d = addDays(d, 1)) {
    const n = bookings.filter((b) => startOfDay(b.checkIn) <= d && startOfDay(b.checkOut) > d).length;
    peak = Math.max(peak, n);
  }
  return { total, booked: peak, free: Math.max(0, total - peak) };
};

// Another live booking with the same physical room overlapping the stay?
const roomConflict = (roomId, checkIn, checkOut, excludeId) =>
  Booking.exists({
    _id: { $ne: excludeId },
    room: roomId,
    status: { $in: ACTIVE },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn }
  });

const planAllowsType = (plan, typeName) => !plan.roomTypes?.length || plan.roomTypes.includes(typeName);

const defaultPlan = async () => (await RatePlan.findOne({ isDefault: true, active: true })) || RatePlan.findOne({ active: true, isPublic: true });

module.exports = { nightsBetween, priceStay, typeAvailability, roomConflict, planAllowsType, defaultPlan, RoomType, RatePlan };
