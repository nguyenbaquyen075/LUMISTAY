const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Room = require('./models/Room');

dotenv.config();

const nestaRooms = [
  {
    name: 'Phòng Superior',
    type: 'Superior',
    description: 'Không gian được thiết kế gọn gàng và yên tĩnh, trang bị đầy đủ các tiện nghi hiện đại cùng hệ thống cách âm hiệu quả. Phù hợp cho những kỳ lưu trú ngắn ngày, nơi sự thoải mái và riêng tư luôn được đặt lên hàng đầu.',
    shortDescription: '30m2 • 1 Giường đôi lớn • Hướng thành phố',
    price: 1250000,
    area: 30,
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    images: [
      'https://nestahotel.com.vn/wp-content/uploads/2026/02/rt_802_2_1550028799.jpg',
      'https://nestahotel.com.vn/wp-content/uploads/2026/02/905_12-1-scaled.webp',
      'https://nestahotel.com.vn/wp-content/uploads/2026/02/905_3-1-2-scaled.jpg'
    ],
    amenities: ['Wi-Fi miễn phí', 'Smart TV', 'Két an toàn', 'Điều hòa', 'Phòng tắm riêng', 'Bàn làm việc'],
    features: [
      { icon: '🛏️', label: '1 Giường đôi lớn' },
      { icon: '👥', label: 'Tối đa 2 khách' },
      { icon: '📐', label: '30 m²' }
    ],
    floor: 4,
    isAvailable: true,
    isFeatured: true,
    rating: 4.8,
    reviewCount: 95
  },
  {
    name: 'Phòng Deluxe',
    type: 'Deluxe',
    description: 'Thiết kế theo phong cách tối giản hiện đại, hài hòa giữa nét tinh tế và cảm giác ấm áp. Không gian mở vừa đủ, lý tưởng để nghỉ ngơi và thư giãn sau một ngày làm việc hoặc khám phá nhịp sống Hà Nội.',
    shortDescription: '38m2 • 2 giường đơn hoặc 1 giường đôi lớn • Hướng thành phố',
    price: 1650000,
    area: 38,
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    images: [
      'https://nestahotel.com.vn/wp-content/uploads/2026/02/Sup_Delux-twin-1.webp',
      'https://nestahotel.com.vn/wp-content/uploads/2026/02/905_12-1-1.webp',
      'https://nestahotel.com.vn/wp-content/uploads/2026/02/905_6-1-1.webp'
    ],
    amenities: ['Wi-Fi miễn phí', 'Smart TV', 'Két an toàn', 'Điều hòa', 'Bồn tắm riêng', 'Bàn làm việc', 'Minibar'],
    features: [
      { icon: '🛏️', label: '2 giường đơn / 1 giường đôi' },
      { icon: '👥', label: 'Tối đa 2 khách' },
      { icon: '📐', label: '38 m²' }
    ],
    floor: 6,
    isAvailable: true,
    isFeatured: true,
    rating: 4.9,
    reviewCount: 142
  },
  {
    name: 'Phòng Executive',
    type: 'Executive',
    description: 'Mang đến trải nghiệm lưu trú cao cấp với không gian rộng rãi, riêng tư và được bài trí tinh tế. Là lựa chọn lý tưởng cho sự thoải mái, tiện nghi và mong muốn tận hưởng trọn vẹn từng khoảnh khắc trong kỳ nghỉ hay chuyến công tác.',
    shortDescription: '45m2 • 2 giường đơn hoặc 1 giường đôi lớn • Hướng thành phố',
    price: 2150000,
    area: 45,
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    images: [
      'https://nestahotel.com.vn/wp-content/uploads/2026/02/Executive-Double-1.webp',
      'https://nestahotel.com.vn/wp-content/uploads/2026/02/Executive-1.webp',
      'https://nestahotel.com.vn/wp-content/uploads/2026/02/905_12-1-1-1.webp'
    ],
    amenities: ['Wi-Fi miễn phí', 'Smart TV', 'Két an toàn', 'Điều hòa', 'Bồn tắm cao cấp', 'Bàn làm việc', 'Minibar', 'Sofa tiếp khách'],
    features: [
      { icon: '🛏️', label: '1 giường King / 2 giường đơn' },
      { icon: '👥', label: 'Tối đa 2 khách' },
      { icon: '📐', label: '45 m²' }
    ],
    floor: 8,
    isAvailable: true,
    isFeatured: true,
    rating: 4.95,
    reviewCount: 88
  },
  {
    name: 'Phòng Nesta Suite',
    type: 'Suite',
    description: 'Hạng phòng cao cấp, nổi bật với không gian sang trọng và thiết kế tinh tế. Cửa sổ thoáng đãng hướng ra phố mang đến tầm nhìn mở, cảm nhận rõ nét nhịp sống năng động của Thủ đô, đồng thời tận hưởng trọn vẹn sự thư thái và riêng tư.',
    shortDescription: '60m2 • 1 giường đôi lớn • Hướng thành phố panorama',
    price: 2950000,
    area: 60,
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 2,
    images: [
      'https://nestahotel.com.vn/wp-content/uploads/2026/02/Suite-1.webp',
      'https://nestahotel.com.vn/wp-content/uploads/2026/02/905_3-1-1.webp',
      'https://nestahotel.com.vn/wp-content/uploads/2026/02/905_12-1-1-2.webp',
      'https://nestahotel.com.vn/wp-content/uploads/2026/02/905_6-1-1-1.webp'
    ],
    amenities: ['Wi-Fi tốc độ cao', 'Smart TV 65"', 'Jacuzzi', 'Ban công panorama', 'Butler service', 'Rượu vang chào đón', 'Phòng khách riêng'],
    features: [
      { icon: '🛏️', label: '1 Giường King' },
      { icon: '👥', label: 'Tối đa 2 khách' },
      { icon: '📐', label: '60 m²' }
    ],
    floor: 9,
    isAvailable: true,
    isFeatured: true,
    rating: 5.0,
    reviewCount: 65
  }
];

async function updateRooms() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lumistay');
    console.log('Connected to MongoDB');
    await Room.deleteMany({});
    console.log('Cleared old rooms');
    await Room.insertMany(nestaRooms);
    console.log('Successfully seeded Nesta Hanoi rooms!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding rooms:', err);
    process.exit(1);
  }
}

updateRooms();
