# LumiStay Hotel & Resort - 5-Star Luxury Booking System 🌟

Hệ thống website khách sạn & nghỉ dưỡng cao cấp **LumiStay**, thiết kế sang trọng dựa trên bản mẫu thiết kế (màu vàng kim sang trọng kết hợp màu xanh hải quân ban đêm, hiệu ứng glassmorphism và typography Playfair Display).

---

## 🚀 Công Nghệ Sử Dụng

- **Frontend**: React 19, Vite, React Router DOM, Axios, Vanilla CSS (Design System tùy chỉnh), React Icons, Framer Motion.
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT Authentication, Bcryptjs, CORS.
- **Tính Năng AI**: Chatbot Lumi AI hỗ trợ trực tuyến 24/7.

---

## 🏨 Các Tính Năng Đã Triển Khai

1. **Trang Chủ (Home)**:
   - **Hero Section**: Banner hoàng hôn nghỉ dưỡng tuyệt đẹp, typography đẳng cấp, 3 điểm nhấn (Vị trí đắc địa, Dịch vụ 5 sao, Công nghệ AI), nút xem video giới thiệu.
   - **Thanh Đặt Phòng Nhanh (Booking Bar)**: Chọn ngày nhận phòng, ngày trả phòng, số khách và tìm kiếm phòng trực tiếp.
   - **Giới Thiệu (About Section)**: Thiết kế 3 khung hình độc đáo (Kiến trúc nghỉ dưỡng, Thông số 5 sao / 120 phòng / 800+ khách, Đại sảnh sang trọng).
   - **Phòng Nghỉ Nổi Bật (Featured Rooms)**: Carousel trượt ngang hiển thị Deluxe Ocean View, Premier Suite, Family Room, Villa View Biển với thông số diện tích, số giường, số khách và giá tiền.
   - **Dịch Vụ Tiện Ích (Services)**: 5 dịch vụ chuẩn 5 sao (Nhà hàng & Bar, Spa & Wellness, Hồ bơi vô cực, Gym & Fitness, Dịch vụ xe cao cấp).
   - **Đánh Giá Khách Hàng (Testimonials)**: Trải nghiệm thực tế với đánh giá 5 sao và thư pháp "Khách hàng nói gì về chúng tôi?".
   - **CTA Banner**: Kêu gọi đặt phòng ngay ở chân trang.

2. **Hệ Thống Đặt Phòng Online (Booking System)**:
   - Modal đặt phòng trực tuyến tính tiền tự động theo số đêm và loại phòng.
   - Hỗ trợ chọn phương thức thanh toán (Chuyển khoản QR, Tiền mặt tại lễ tân, Thẻ tín dụng).
   - Tạo mã đặt phòng tự động (VD: `LS91084012DY3W`).

3. **Tra Cứu Đặt Phòng (Booking Lookup)**:
   - Tra cứu trạng thái đơn đặt phòng chỉ bằng mã đặt phòng.

4. **Trang Danh Mục & Chi Tiết Phòng (Rooms & Room Detail)**:
   - Bộ lọc theo hạng phòng, khoảng giá và tìm kiếm từ khóa.
   - Trang chi tiết phòng với bộ sưu tập ảnh, tiện nghi chi tiết, chính sách check-in/check-out.

5. **Trợ Lý Ảo Lumi AI (Chatbot)**:
   - Nút nổi Lumi AI tư vấn trực tiếp 24/7 về giá phòng, dịch vụ, buffet sáng, check-in.

6. **Trang Quản Trị Admin (Admin Dashboard)**:
   - Thống kê doanh thu, tổng số đơn đặt phòng, đơn chờ duyệt.
   - Quản lý danh sách đặt phòng: Duyệt đơn, Xác nhận thanh toán, Hủy đơn.
   - Quản lý hạng phòng: Thêm phòng mới, Xóa phòng.

7. **Xác Thực (Authentication)**:
   - Đăng nhập, đăng ký tài khoản thành viên.
   - Nút bấm tự động điền nhanh tài khoản Admin demo.

---

## 🔑 Tài Khoản Admin Mặc Định

- **Email**: `admin@lumistay.com`
- **Mật khẩu**: `admin123456`

---

## 💻 Hướng Dẫn Chạy Dự Án

### 1. Khởi động Backend
```bash
cd backend
npm install
npm start
# Backend chạy tại: http://localhost:5001
```

### 2. Khởi động Frontend
```bash
cd frontend
npm install
npm run dev
# Frontend chạy tại: http://localhost:5173
```
