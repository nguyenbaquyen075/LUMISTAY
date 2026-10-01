// Idempotent upgrades so older databases work with the PMS features. Runs on every start.
const Room = require('../models/Room');
const RoomType = require('../models/RoomType');
const RatePlan = require('../models/RatePlan');
const Booking = require('../models/Booking');
const HotelSettings = require('../models/HotelSettings');

const DEFAULT_COMMISSIONS = { booking_com: 15, agoda: 17, expedia: 18, traveloka: 15, airbnb: 3, corporate: 0 };

module.exports = async () => {
  // Room types from existing rooms
  if (!(await RoomType.countDocuments())) {
    const rooms = await Room.find().lean();
    const byType = {};
    for (const r of rooms) (byType[r.type] ||= []).push(r);
    for (const [name, list] of Object.entries(byType)) {
      const maxGuests = Math.max(...list.map((r) => r.maxGuests || 2));
      await RoomType.create({
        name,
        description: list[0].shortDescription || '',
        basePrice: Math.min(...list.map((r) => r.price)),
        baseAdults: Math.min(2, maxGuests),
        maxAdults: maxGuests,
        maxChildren: Math.max(1, maxGuests - 1),
        extraAdultFee: Math.round((Math.min(...list.map((r) => r.price)) * 0.2) / 10000) * 10000
      });
    }
  }

  if (!(await RatePlan.countDocuments())) {
    await RatePlan.insertMany([
      { code: 'BAR', name: 'Giá chuẩn', description: 'Hủy miễn phí trước 48 giờ', isDefault: true, freeCancelHours: 48, penaltyNights: 1 },
      { code: 'BB', name: 'Kèm bữa sáng', description: 'Đã gồm buffet sáng cho 2 khách', adjustPercent: 10, breakfast: true },
      { code: 'NRF', name: 'Không hoàn hủy', description: 'Giá tốt nhất, thanh toán trước, không hoàn hủy', adjustPercent: -10, nonRefundable: true, depositPercent: 100 },
      { code: 'CORP', name: 'Giá doanh nghiệp', description: 'Dành cho công ty ký hợp đồng', adjustPercent: -15, isPublic: false }
    ]);
  }

  const settings = await HotelSettings.get();
  if (!settings.commissions || settings.commissions.size === 0) {
    settings.commissions = DEFAULT_COMMISSIONS;
    await settings.save();
  }

  // Legacy rooms / bookings
  await Room.updateMany({ status: 'cleaning' }, { status: 'available', hkStatus: 'dirty' });
  await Booking.updateMany({ source: 'online' }, { source: 'website' });
  const legacy = await Booking.find({ roomType: { $exists: false } }).populate('room', 'type');
  for (const b of legacy) {
    await Booking.updateOne({ _id: b._id }, { roomType: b.room?.type || 'Khác' });
  }
};
