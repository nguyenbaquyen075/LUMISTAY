const Room = require('../models/Room');
const Review = require('../models/Review');
const Service = require('../models/Service');
const User = require('../models/User');

const seedData = async () => {
  try {
    const existingRooms = await Room.countDocuments();
    if (existingRooms > 0) {
      console.log('📦 Database already seeded, skipping...');
      return;
    }

    console.log('🌱 Seeding initial data...');

    // Create admin user
    const adminExists = await User.findOne({ email: 'admin@lumistay.com' });
    if (!adminExists) {
      await User.create({
        name: 'Admin LumiStay',
        email: 'admin@lumistay.com',
        password: 'admin123456',
        role: 'admin',
        phone: '+84 258 123 4567'
      });
      console.log('👤 Admin user created: admin@lumistay.com / admin123456');
    }

    // Seed Rooms
    const rooms = await Room.insertMany([
      {
        name: 'Deluxe Ocean View',
        type: 'Deluxe',
        description: 'Phòng Deluxe sang trọng với tầm nhìn trực diện ra biển. Được trang bị nội thất cao cấp, giường King size êm ái và ban công riêng tư. Mỗi buổi sáng thức dậy với khung cảnh biển xanh tuyệt đẹp và ánh bình minh rực rỡ.',
        shortDescription: 'Tầm nhìn biển tuyệt đẹp, ban công riêng',
        price: 2000000,
        area: 45,
        maxGuests: 2,
        bedrooms: 1,
        bathrooms: 1,
        images: [
          'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
          'https://images.unsplash.com/photo-1631049421450-348ccd7f8949?w=800&q=80',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80'
        ],
        amenities: ['WiFi miễn phí', 'Smart TV 55"', 'Minibar', 'Điều hòa', 'Bồn tắm', 'Ban công biển', 'Dịch vụ phòng 24/7'],
        features: [
          { icon: '🛏️', label: '1 giường King' },
          { icon: '👥', label: 'Tối đa 2 khách' },
          { icon: '📐', label: '45 m²' }
        ],
        floor: 3,
        isAvailable: true,
        isFeatured: true,
        rating: 4.8,
        reviewCount: 124
      },
      {
        name: 'Premier Suite',
        type: 'Premier Suite',
        description: 'Premier Suite là sự kết hợp hoàn hảo giữa không gian sống rộng rãi và tiện nghi đẳng cấp. Phòng khách riêng biệt, phòng ngủ sang trọng với giường King size và phòng tắm marble cao cấp tạo nên không gian nghỉ dưỡng lý tưởng.',
        shortDescription: 'Suite rộng rãi, phòng khách riêng biệt',
        price: 3500000,
        area: 65,
        maxGuests: 3,
        bedrooms: 1,
        bathrooms: 2,
        images: [
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
          'https://images.unsplash.com/photo-1560347876-aeef00ee58a1?w=800&q=80',
          'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80'
        ],
        amenities: ['WiFi miễn phí', 'Smart TV 65"', 'Minibar cao cấp', 'Bồn tắm Jacuzzi', 'Phòng khách', 'Ban công rộng', 'Butler service', 'Điều hòa', 'Két sắt'],
        features: [
          { icon: '🛏️', label: '1 giường King' },
          { icon: '👥', label: 'Tối đa 3 khách' },
          { icon: '📐', label: '65 m²' }
        ],
        floor: 5,
        isAvailable: true,
        isFeatured: true,
        rating: 4.9,
        reviewCount: 89
      },
      {
        name: 'Family Room',
        type: 'Family Room',
        description: 'Phòng Family được thiết kế đặc biệt cho gia đình, với không gian rộng rãi và tiện nghi đầy đủ. Hai phòng ngủ riêng biệt, phòng khách chung và khu vực chơi cho trẻ em tạo nên trải nghiệm nghỉ dưỡng hoàn hảo cho cả gia đình.',
        shortDescription: 'Lý tưởng cho gia đình, 2 phòng ngủ riêng',
        price: 4500000,
        area: 80,
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 2,
        images: [
          'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&q=80',
          'https://images.unsplash.com/photo-1566195992011-5f6b21e539aa?w=800&q=80',
          'https://images.unsplash.com/photo-1571508601891-ca5e7a713859?w=800&q=80'
        ],
        amenities: ['WiFi miễn phí', '2 Smart TV', 'Minibar', 'Bồn tắm trẻ em', '2 phòng ngủ', 'Phòng khách', 'Bàn ăn gia đình', 'Điều hòa'],
        features: [
          { icon: '🛏️', label: '2 giường' },
          { icon: '👥', label: 'Tối đa 4 khách' },
          { icon: '📐', label: '80 m²' }
        ],
        floor: 4,
        isAvailable: true,
        isFeatured: true,
        rating: 4.7,
        reviewCount: 156
      },
      {
        name: 'Villa View Biển',
        type: 'Villa',
        description: 'Villa sang trọng nhất của LumiStay với hồ bơi riêng, vườn nhiệt đới và tầm nhìn 360 độ ra biển. Đây là không gian nghỉ dưỡng đỉnh cao dành cho những ai muốn trải nghiệm sự xa hoa tuyệt đỉnh, với 3 phòng ngủ rộng rãi và không gian sinh hoạt như một ngôi nhà hoàn chỉnh.',
        shortDescription: 'Villa riêng biệt, hồ bơi private, tầm nhìn 360°',
        price: 8000000,
        area: 120,
        maxGuests: 6,
        bedrooms: 3,
        bathrooms: 3,
        images: [
          'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
          'https://images.unsplash.com/photo-1615880484746-a134be9a6ecf?w=800&q=80',
          'https://images.unsplash.com/photo-1573052905904-34ad8c27f0cc?w=800&q=80'
        ],
        amenities: ['Hồ bơi riêng', 'Vườn tropical', 'WiFi gigabit', '3 Smart TV 75"', 'Minibar cao cấp', 'Bếp đầy đủ', 'BBQ ngoài trời', 'Butler riêng', 'Golf cart'],
        features: [
          { icon: '🛏️', label: '3 phòng ngủ' },
          { icon: '👥', label: 'Tối đa 6 khách' },
          { icon: '📐', label: '120 m²' }
        ],
        floor: 1,
        isAvailable: true,
        isFeatured: true,
        rating: 5.0,
        reviewCount: 42
      },
      {
        name: 'Standard Sea View',
        type: 'Standard',
        description: 'Phòng Standard thoải mái với tầm nhìn ra biển, phù hợp cho khách du lịch muốn tận hưởng kỳ nghỉ chất lượng với mức giá hợp lý.',
        shortDescription: 'Tiêu chuẩn cao, giá tốt, view biển',
        price: 1200000,
        area: 30,
        maxGuests: 2,
        bedrooms: 1,
        bathrooms: 1,
        images: [
          'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80',
          'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800&q=80'
        ],
        amenities: ['WiFi miễn phí', 'Smart TV 43"', 'Minibar', 'Điều hòa', 'View biển'],
        features: [
          { icon: '🛏️', label: '1 giường Queen' },
          { icon: '👥', label: 'Tối đa 2 khách' },
          { icon: '📐', label: '30 m²' }
        ],
        floor: 2,
        isAvailable: true,
        isFeatured: false,
        rating: 4.5,
        reviewCount: 203
      }
    ]);

    // Seed Services
    await Service.insertMany([
      {
        name: 'Nhà hàng & Bar',
        category: 'restaurant',
        description: 'Thưởng thức ẩm thực A-la-carte tinh tế với thực đơn phong phú từ món Việt truyền thống đến các món Âu châu đẳng cấp. Nhà hàng LumiStay nằm bên bờ biển với tầm nhìn tuyệt đẹp.',
        shortDescription: 'Tinh hoa ẩm thực Á-Âu',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
        icon: '🍽️',
        isFeatured: true,
        openTime: '06:00',
        closeTime: '23:00',
        order: 1
      },
      {
        name: 'Spa & Wellness',
        category: 'spa',
        description: 'Không gian spa sang trọng với các liệu pháp massage truyền thống và hiện đại, chăm sóc da chuyên sâu và các dịch vụ wellness toàn diện.',
        shortDescription: 'Thư giãn, tái tạo năng lượng',
        image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
        icon: '💆',
        isFeatured: true,
        openTime: '09:00',
        closeTime: '21:00',
        order: 2
      },
      {
        name: 'Hồ bơi vô cực',
        category: 'pool',
        description: 'Hồ bơi vô cực ngoài trời với tầm nhìn panorama ra biển. Bao quanh bởi cây xanh nhiệt đới và khu vực nằm tắm nắng sang trọng.',
        shortDescription: 'Tầm nhìn đại dương, thư giãn sang',
        image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80',
        icon: '🏊',
        isFeatured: true,
        openTime: '06:00',
        closeTime: '20:00',
        order: 3
      },
      {
        name: 'Gym & Fitness',
        category: 'gym',
        description: 'Trung tâm thể dục hiện đại với trang thiết bị cao cấp nhất, huấn luyện viên cá nhân và các lớp yoga/pilates hàng ngày.',
        shortDescription: 'Tập luyện chuyên nghiệp',
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
        icon: '💪',
        isFeatured: true,
        openTime: '05:00',
        closeTime: '23:00',
        order: 4
      },
      {
        name: 'Dịch vụ xe cao cấp',
        category: 'transport',
        description: 'Dịch vụ đưa đón sân bay, xe limousine, và cho thuê xe với tài xế riêng. Đảm bảo sự thoải mái và đẳng cấp trong mọi chuyến đi.',
        shortDescription: 'Đưa đón, limousine sang trọng',
        image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80',
        icon: '🚗',
        isFeatured: true,
        openTime: '00:00',
        closeTime: '23:59',
        order: 5
      }
    ]);

    // Seed Reviews
    await Review.insertMany([
      {
        guestName: 'Nguyễn Thu Mai',
        guestAvatar: 'https://i.pravatar.cc/150?img=1',
        guestNationality: 'Việt Nam',
        guestTitle: 'Doanh nhân',
        rating: 5,
        ratings: { service: 5, cleanliness: 5, location: 5, value: 5 },
        content: 'LumiStay đã mang lại cho tôi một kỳ nghỉ đáng nhớ. Phòng Deluxe Ocean View với tầm nhìn biển tuyệt đẹp, nhân viên phục vụ chuyên nghiệp và tận tâm. Đặc biệt dịch vụ spa và nhà hàng đều xuất sắc!',
        title: 'Kỳ nghỉ hoàn hảo',
        isFeatured: true,
        room: rooms[0]._id
      },
      {
        guestName: 'Trần Văn Hùng',
        guestAvatar: 'https://i.pravatar.cc/150?img=3',
        guestNationality: 'Việt Nam',
        guestTitle: 'Doanh nhân',
        rating: 5,
        ratings: { service: 5, cleanliness: 5, location: 4, value: 5 },
        content: 'LumiStay mang đến trải nghiệm nghỉ dưỡng đẳng cấp đặc biệt. Hồ bơi vô cực với tầm nhìn ra biển thực sự ấn tượng. Tôi sẽ quay lại đây vào lần tới.',
        title: 'Rất ấn tượng',
        isFeatured: true,
        room: rooms[1]._id
      },
      {
        guestName: 'Lê Thị Trang',
        guestAvatar: 'https://i.pravatar.cc/150?img=5',
        guestNationality: 'Việt Nam',
        guestTitle: 'Du khách',
        rating: 5,
        ratings: { service: 5, cleanliness: 5, location: 5, value: 4 },
        content: 'Tôi cảm ơn LumiStay vì sự chu đáo và ân cần của đội ngũ nhân viên. Mọi chi tiết đều được chú ý tỉ mỉ. Đặc biệt bữa sáng buffet rất phong phú và ngon.',
        title: 'Nhân viên rất tận tâm',
        isFeatured: true,
        room: rooms[2]._id
      },
      {
        guestName: 'Michael Chen',
        guestAvatar: 'https://i.pravatar.cc/150?img=7',
        guestNationality: 'Singapore',
        guestTitle: 'Business Traveler',
        rating: 5,
        ratings: { service: 5, cleanliness: 5, location: 5, value: 5 },
        content: 'Amazing resort! The villa with private pool was absolutely stunning. Perfect for a romantic getaway. The staff spoke excellent English and were extremely helpful.',
        title: 'Absolutely stunning!',
        isFeatured: true,
        room: rooms[3]._id
      }
    ]);

    console.log('✅ Database seeded successfully!');
    console.log(`   📌 ${rooms.length} rooms created`);
    console.log('   🛎️  5 services created');
    console.log('   ⭐ 4 reviews created');
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
  }
};

module.exports = seedData;
