const A = require('./analytics');

const checkInDeadline = (b, settings) => {
  const [h, m] = (settings.checkInTime || '14:00').split(':').map(Number);
  const d = A.startOfDay(b.checkIn);
  d.setHours(h, m, 0, 0);
  return d;
};

// What cancelling / not showing up costs under the booking's rate-plan policy
const penalty = (b, settings, now = new Date()) => {
  const pol = b.policy || {};
  if (pol.nonRefundable) return { fee: A.roomTotal(b), rule: 'Gói không hoàn hủy: tính toàn bộ tiền phòng.' };
  const freeUntil = new Date(checkInDeadline(b, settings) - (pol.freeCancelHours ?? 48) * 3600e3);
  if (now <= freeUntil) return { fee: 0, rule: `Hủy miễn phí đến ${freeUntil.toLocaleString('vi-VN')}.` };
  const n = Math.max(1, pol.penaltyNights ?? 1);
  const fee = Math.round(A.sum(b.nightlyRates.slice(0, n).map((_, i) => A.nightRate(b, i))));
  return { fee: Math.min(fee, A.roomTotal(b)), rule: `Hủy muộn: tính ${n} đêm đầu.` };
};

module.exports = { penalty, checkInDeadline };
