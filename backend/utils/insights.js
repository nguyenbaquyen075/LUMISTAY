// "AI" analytics for the admin: statistical forecasts, anomaly checks, customer segmentation.
// Deliberately simple and explainable (weekday seasonality + on-the-books bookings, RFM-style rules);
// the conversational assistant (routes/admin.js /ai/ask) reasons over the output of snapshot().
const Booking = require('../models/Booking');
const {
  DAY, REVENUE, startOfDay, addDays, dayKey, sum, grandTotal, loadBookings, buildDaily, roomBoard, sellableRooms
} = require('./analytics');

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const pct = (x) => Math.round(x * 100);
const monthStart = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const avg = (a) => (a.length ? sum(a) / a.length : 0);
const asDate = (key) => new Date(key + 'T00:00:00');

// ponytail: weekday-average × recent trend; swap for Holt-Winters/ML once there is > 1 year of history
const forecast = async (days = 7, now = new Date()) => {
  const today = startOfDay(now);
  const mStart = monthStart(today);
  const mEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const from = new Date(Math.min(addDays(today, -56), mStart));
  const to = new Date(Math.max(addDays(today, days), mEnd));
  const [totalRooms, bookings] = await Promise.all([sellableRooms(), loadBookings(from, to)]);
  const empty = { days: [], month: { actual: 0, projected: 0, expected: 0 }, adr: 0, trend: 1, totalRooms };
  if (!totalRooms) return empty;

  const daily = buildDaily(bookings, from, to);
  const byKey = Object.fromEntries(daily.map((d) => [d.date, d]));
  const occ = (d) => d.occupied / totalRooms;

  // Weekday seasonality from the last 8 weeks, scaled by the 4-week vs previous-4-week trend
  const past = daily.filter((d) => asDate(d.date) < today);
  const weekday = {};
  for (const d of past) (weekday[asDate(d.date).getDay()] ||= []).push(occ(d));
  const recent = avg(past.slice(-28).map(occ));
  const before = avg(past.slice(-56, -28).map(occ));
  const trend = recent && before ? Math.min(1.2, Math.max(0.8, recent / before)) : 1;

  const last28 = past.slice(-28);
  const nights = sum(last28, (d) => d.occupied);
  const adr = nights ? sum(last28, (d) => d.roomRevenue) / nights : 0;
  const extrasPerDay = avg(last28.map((d) => d.serviceRevenue + d.foodRevenue));

  const predict = (d) => {
    const baseline = avg(weekday[asDate(d.date).getDay()] || []) * trend;
    return Math.min(1, Math.max(occ(d), baseline));
  };

  const next = [];
  for (let i = 0; i < days; i++) {
    const d = byKey[dayKey(addDays(today, i))];
    const predicted = predict(d);
    next.push({ date: d.date, weekday: WEEKDAYS[asDate(d.date).getDay()], onBooks: occ(d), predicted, high: predicted >= 0.9 });
  }

  // Month revenue: booked-to-date + projection for the remaining days
  let actual = 0;
  let projected = 0;
  for (const d of daily) {
    const t = asDate(d.date);
    if (t < mStart || t >= mEnd) continue;
    if (t <= today) actual += d.revenue;
    else projected += predict(d) * totalRooms * adr + extrasPerDay;
  }
  return { days: next, month: { actual, projected, expected: actual + projected }, adr, trend, totalRooms };
};

const anomalies = async (now = new Date()) => {
  const today = startOfDay(now);
  const from = addDays(today, -35);
  const to = addDays(today, 1);
  const [totalRooms, bookings] = await Promise.all([sellableRooms(), loadBookings(from, to)]);
  const daily = buildDaily(bookings, from, to);
  const last7 = daily.slice(-7);
  const prev28 = daily.slice(0, -7);
  const out = [];

  const compare = (label, cur, prevTotal, { drop = 0.2, rise = 0.3 } = {}) => {
    const baseline = prevTotal / 4; // average week over the previous 4 weeks
    if (baseline <= 0) return;
    const delta = (cur - baseline) / baseline;
    if (delta <= -drop) out.push({ level: 'warning', message: `⚠️ ${label} giảm ${pct(-delta)}% so với trung bình 4 tuần.` });
    else if (delta >= rise) out.push({ level: 'info', message: `📈 ${label} tăng ${pct(delta)}% so với trung bình 4 tuần.` });
  };

  const types = new Set(daily.flatMap((d) => Object.keys(d.byType)));
  for (const t of types) {
    compare(`Doanh thu phòng ${t}`, sum(last7, (d) => d.byType[t] || 0), sum(prev28, (d) => d.byType[t] || 0));
  }
  compare('Tổng doanh thu', sum(last7, (d) => d.revenue), sum(prev28, (d) => d.revenue));
  if (totalRooms) compare('Công suất phòng', sum(last7, (d) => d.occupied), sum(prev28, (d) => d.occupied));

  // Cancellation spike
  const cancelled = await Booking.find({ status: 'cancelled', updatedAt: { $gte: from, $lt: to } }).select('updatedAt').lean();
  const c7 = cancelled.filter((b) => b.updatedAt >= addDays(today, -6)).length;
  const weeklyPrev = (cancelled.length - c7) / 4;
  if (c7 >= 3 && weeklyPrev > 0 && (c7 - weeklyPrev) / weeklyPrev >= 0.5) {
    out.push({ level: 'warning', message: `⚠️ Số đơn hủy tuần này (${c7}) cao hơn ${pct((c7 - weeklyPrev) / weeklyPrev)}% so với trung bình 4 tuần.` });
  }
  if (!out.length) out.push({ level: 'ok', message: '✅ Chưa phát hiện bất thường trong 7 ngày qua.' });
  return out;
};

// Per-guest stats keyed by email
const guestStats = async () => {
  const bookings = await Booking.find({ status: { $nin: ['cancelled', 'no_show'] } })
    .populate('room', 'name type roomNumber')
    .sort({ checkIn: 1 })
    .lean();
  const map = new Map();
  for (const b of bookings) {
    const email = (b.guestInfo.email || '').toLowerCase();
    if (!email) continue;
    const g = map.get(email) || { email, name: b.guestInfo.name, phone: b.guestInfo.phone, bookings: [], spent: 0 };
    g.name = b.guestInfo.name;
    g.phone = b.guestInfo.phone;
    g.bookings.push(b);
    if (REVENUE.includes(b.status)) g.spent += grandTotal(b);
    map.set(email, g);
  }
  const now = new Date();
  return [...map.values()].map((g) => {
    const started = g.bookings.filter((b) => b.checkIn <= now);
    return {
      ...g,
      count: g.bookings.length,
      lastStay: started.length ? started[started.length - 1].checkOut : null, // most recent stay that has begun
      upcoming: g.bookings.some((b) => b.checkIn > now),
      firstBooked: g.bookings[0].createdAt
    };
  });
};

const SEGMENTS = {
  vip: 'Khách có giá trị cao',
  frequent: 'Khách thường xuyên',
  atRisk: 'Khách có nguy cơ không quay lại',
  new: 'Khách mới',
  regular: 'Khách thường'
};

const segmentGuests = (guests, now = new Date()) => {
  const spends = guests.map((g) => g.spent).sort((a, b) => b - a);
  const vipCut = guests.length >= 5 ? spends[Math.floor(guests.length * 0.2)] : Infinity; // top 20% by spend
  const result = {};
  for (const g of guests) {
    const sinceLast = g.lastStay ? (now - new Date(g.lastStay)) / DAY : 0;
    let seg = 'regular';
    if (g.spent > 0 && g.spent >= vipCut) seg = 'vip';
    else if (g.count >= 2 && !g.upcoming && sinceLast > 120) seg = 'atRisk';
    else if (g.count >= 3) seg = 'frequent';
    else if (g.count === 1 && (now - new Date(g.firstBooked)) / DAY <= 60) seg = 'new';
    result[g.email] = seg;
  }
  return result;
};

const segments = async () => {
  const guests = await guestStats();
  const seg = segmentGuests(guests);
  return {
    total: guests.length,
    segments: Object.keys(SEGMENTS).map((key) => {
      const list = guests.filter((g) => seg[g.email] === key).sort((a, b) => b.spent - a.spent);
      return {
        key,
        label: SEGMENTS[key],
        count: list.length,
        top: list.slice(0, 5).map((g) => ({ name: g.name, email: g.email, bookings: g.count, spent: g.spent }))
      };
    })
  };
};

// One human sentence about a guest's habits, derived from their stays
const guestInsight = (guest) => {
  const stays = guest.bookings;
  if (stays.length < 2) return 'Khách mới, chưa đủ dữ liệu để nhận xét thói quen lưu trú.';
  const parts = [];
  const weekend = stays.filter((b) => [5, 6].includes(new Date(b.checkIn).getDay())).length;
  if (weekend / stays.length >= 0.6) parts.push('thường đặt phòng vào cuối tuần');
  const sea = stays.filter((b) => /biển|ocean|sea/i.test(b.room?.name || b.roomType || '')).length;
  const typeCount = {};
  for (const b of stays) if (b.roomType) typeCount[b.roomType] = (typeCount[b.roomType] || 0) + 1;
  const [topType, topN] = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0] || [];
  if (sea / stays.length >= 0.6) parts.push('có xu hướng chọn phòng hướng biển');
  else if (topType && topN >= 2) parts.push(`hay chọn phòng ${topType}`);
  parts.push(`ở trung bình ${(sum(stays, (b) => b.nights) / stays.length).toFixed(1)} đêm/lần`);
  return `Khách này ${parts.join(' và ')}.`;
};

// Compact data pack the admin assistant answers from
const snapshot = async (now = new Date()) => {
  const today = startOfDay(now);
  const mStart = monthStart(today);
  const prevMStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const to = addDays(today, 1);
  const daily = buildDaily(await loadBookings(prevMStart, to), prevMStart, to);
  const inRange = (a, b) => daily.filter((d) => asDate(d.date) >= a && asDate(d.date) < b);
  const totals = (days) => {
    const byRoom = {};
    const byType = {};
    for (const d of days) {
      for (const [k, v] of Object.entries(d.byRoom)) byRoom[k] = (byRoom[k] || 0) + v;
      for (const [k, v] of Object.entries(d.byType)) byType[k] = (byType[k] || 0) + v;
    }
    const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([name, revenue]) => ({ name, revenue: Math.round(revenue) }));
    return {
      revenue: Math.round(sum(days, (d) => d.revenue)),
      roomRevenue: Math.round(sum(days, (d) => d.roomRevenue)),
      serviceRevenue: Math.round(sum(days, (d) => d.serviceRevenue)),
      foodRevenue: Math.round(sum(days, (d) => d.foodRevenue)),
      occupiedRoomNights: sum(days, (d) => d.occupied),
      byRoom: top(byRoom),
      byRoomType: top(byType)
    };
  };
  const [board, fc, anom, seg] = await Promise.all([roomBoard(now), forecast(7, now), anomalies(now), segments()]);
  const counts = {};
  for (const r of board) counts[r.displayStatus] = (counts[r.displayStatus] || 0) + 1;
  return {
    today: dayKey(today),
    totalRooms: board.length,
    roomStatusNow: counts,
    thisMonth: totals(inRange(mStart, to)),
    previousMonth: totals(inRange(prevMStart, mStart)),
    last7Days: totals(inRange(addDays(today, -6), to)),
    revenueDefinition: 'Doanh thu phòng tính theo từng đêm lưu trú của đơn đã xác nhận/đang ở/đã trả phòng; phí dịch vụ và ăn uống tính theo ngày phát sinh. Đơn chờ xác nhận và đơn hủy không tính.',
    forecast7Days: fc.days.map((d) => ({ date: d.date, onBooksPct: pct(d.onBooks), predictedPct: pct(d.predicted) })),
    forecastMonthRevenue: { actualSoFar: Math.round(fc.month.actual), expectedTotal: Math.round(fc.month.expected) },
    anomalies: anom.map((a) => a.message),
    customerSegments: seg.segments.map((s) => ({ segment: s.label, count: s.count, top: s.top }))
  };
};

module.exports = { forecast, anomalies, segments, guestStats, segmentGuests, guestInsight, snapshot, SEGMENTS };
