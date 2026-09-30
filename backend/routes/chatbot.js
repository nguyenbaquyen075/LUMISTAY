const express = require('express');
const router = express.Router();

const responses = {
  greeting: {
    keywords: ['xin chào', 'hello', 'hi', 'chào', 'hey'],
    answer: 'Xin chào! Tôi là Lumi AI, trợ lý ảo của LumiStay. Tôi có thể giúp bạn tìm phòng, đặt phòng, hoặc trả lời mọi câu hỏi về khách sạn. Bạn cần hỗ trợ gì không? 😊'
  },
  rooms: {
    keywords: ['phòng', 'loại phòng', 'đặt phòng', 'giá phòng', 'room'],
    answer: 'LumiStay có 4 loại phòng cao cấp:\n🏖️ **Deluxe Ocean View** - 2.000.000đ/đêm (45m², tối đa 2 khách)\n🌟 **Premier Suite** - 3.500.000đ/đêm (65m², tối đa 3 khách)\n👨‍👩‍👧‍👦 **Family Room** - 4.500.000đ/đêm (80m², tối đa 4 khách)\n🏡 **Villa View Biển** - 8.000.000đ/đêm (120m², tối đa 6 khách)\n\nBạn muốn tìm hiểu thêm về phòng nào?'
  },
  checkin: {
    keywords: ['nhận phòng', 'check in', 'check-in', 'giờ nhận'],
    answer: '⏰ Giờ nhận phòng tại LumiStay:\n• **Check-in:** 14:00\n• **Check-out:** 12:00\n\nBạn có thể yêu cầu check-in sớm hoặc check-out muộn tùy theo tình trạng phòng. Liên hệ trực tiếp để được sắp xếp!'
  },
  services: {
    keywords: ['dịch vụ', 'tiện ích', 'spa', 'hồ bơi', 'gym', 'nhà hàng'],
    answer: '✨ Dịch vụ 5 sao tại LumiStay:\n🍽️ **Nhà hàng & Bar** - Ẩm thực A-la-carte\n💆 **Spa & Wellness** - Thư giãn toàn diện\n🏊 **Hồ bơi vô cực** - Tầm nhìn đại dương\n💪 **Gym & Fitness** - Hiện đại 24/7\n🚗 **Dịch vụ xe** - Đưa đón sân bay\n\nMọi dịch vụ đều ở đẳng cấp 5 sao!'
  },
  location: {
    keywords: ['địa chỉ', 'vị trí', 'ở đâu', 'đường', 'location'],
    answer: '📍 **LumiStay Hotel & Resort**\nĐịa chỉ: 123 Trần Phú, Nha Trang, Khánh Hòa\nĐiện thoại: +84 258 123 4567\nEmail: info@lumistay.com\n\nChúng tôi tọa lạc ngay bên bờ biển, cách sân bay Cam Ranh 35km.'
  },
  cancel: {
    keywords: ['hủy', 'cancel', 'hoàn tiền', 'refund'],
    answer: '📋 **Chính sách hủy phòng:**\n• Hủy trước 48 giờ: Hoàn tiền 100%\n• Hủy trước 24 giờ: Hoàn tiền 50%\n• Hủy trong vòng 24 giờ: Không hoàn tiền\n\nĐể hủy đặt phòng, vui lòng liên hệ hotline: **+84 258 123 4567**'
  },
  wifi: {
    keywords: ['wifi', 'internet', 'mạng'],
    answer: '📶 LumiStay cung cấp **WiFi miễn phí tốc độ cao** cho tất cả khách lưu trú trong toàn bộ khuôn viên khách sạn. Tốc độ đạt 100Mbps!'
  },
  breakfast: {
    keywords: ['ăn sáng', 'bữa sáng', 'breakfast', 'buffet'],
    answer: '🍳 **Bữa sáng tại LumiStay:**\nBuffet sáng miễn phí từ **06:00 - 10:00** cho tất cả khách. Gồm 50+ món Á-Âu phong phú, trứng làm theo yêu cầu, trái cây tươi và đồ uống!'
  },
  default: 'Cảm ơn bạn đã liên hệ! Tôi chưa hiểu câu hỏi của bạn. Vui lòng thử hỏi về:\n• Các loại phòng và giá cả\n• Dịch vụ tại khách sạn\n• Chính sách check-in/check-out\n• Địa chỉ và liên hệ\n\nHoặc gọi hotline: **+84 258 123 4567** 📞'
};

// @POST /api/chatbot
router.post('/', (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Vui lòng nhập tin nhắn.' });

    const lowerMsg = message.toLowerCase().trim();
    let answer = responses.default;

    for (const [key, data] of Object.entries(responses)) {
      if (key === 'default') continue;
      if (data.keywords.some(kw => lowerMsg.includes(kw))) {
        answer = data.answer;
        break;
      }
    }

    setTimeout(() => {
      res.json({ success: true, message: answer, timestamp: new Date() });
    }, 500); // Simulate thinking delay
  } catch (err) {
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra. Vui lòng thử lại.' });
  }
});

module.exports = router;
