import React, { useState } from 'react';
import { FiSearch, FiCheckCircle, FiClock, FiCalendar, FiUser, FiCreditCard } from 'react-icons/fi';
import api from '../utils/api';
import { formatPrice, getStatusColor, getStatusLabel, getPaymentLabel } from '../utils/helpers';
import './BookingLookupPage.css';

const BookingLookupPage = () => {
  const [code, setCode] = useState('');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setBooking(null);

    try {
      const res = await api.get(`/bookings/code/${code.trim()}`);
      if (res.data.success) {
        setBooking(res.data.booking);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không tìm thấy thông tin đặt phòng với mã này.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-lookup-page">
      <div className="page-header-banner">
        <div className="banner-overlay"></div>
        <div className="container banner-content">
          <span className="section-label">TRA CỨU NHANH</span>
          <h1 className="banner-title">Tra Cứu Đặt Phòng</h1>
          <p className="banner-sub">
            Nhập mã đặt phòng (ví dụ: LS...) để kiểm tra tình trạng đặt phòng, thông tin chi tiết và tiến trình xử lý.
          </p>
        </div>
      </div>

      <div className="container lookup-container">
        {/* Search Box */}
        <div className="lookup-search-card">
          <form onSubmit={handleLookup} className="lookup-form">
            <input 
              type="text" 
              placeholder="Nhập mã đặt phòng của bạn (VD: LS12345678)..." 
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
            />
            <button type="submit" disabled={loading} className="btn btn-primary">
              <FiSearch /> {loading ? 'Đang tìm...' : 'Tra cứu'}
            </button>
          </form>
        </div>

        {error && <div className="lookup-error-msg">{error}</div>}

        {/* Result Card */}
        {booking && (
          <div className="booking-result-card animate-fade-up">
            <div className="result-header">
              <div>
                <span className="res-code-label">MÃ ĐẶT PHÒNG:</span>
                <h3 className="res-code-val">{booking.bookingCode}</h3>
              </div>
              <span className={`badge ${getStatusColor(booking.status)} res-status-badge`}>
                {getStatusLabel(booking.status)}
              </span>
            </div>

            <div className="result-grid">
              <div className="result-block">
                <h4><FiUser /> Thông Tin Khách Hàng</h4>
                <div className="info-line"><span>Họ tên:</span> <strong>{booking.guestInfo?.name}</strong></div>
                <div className="info-line"><span>Số điện thoại:</span> <span>{booking.guestInfo?.phone}</span></div>
                <div className="info-line"><span>Email:</span> <span>{booking.guestInfo?.email}</span></div>
              </div>

              <div className="result-block">
                <h4><FiCalendar /> Lịch Trình Lưu Trú</h4>
                <div className="info-line"><span>Phòng:</span> <strong>{booking.room?.name}</strong></div>
                <div className="info-line"><span>Nhận phòng:</span> <span>{new Date(booking.checkIn).toLocaleDateString('vi-VN')}</span></div>
                <div className="info-line"><span>Trả phòng:</span> <span>{new Date(booking.checkOut).toLocaleDateString('vi-VN')}</span></div>
                <div className="info-line"><span>Số đêm:</span> <span>{booking.nights} đêm</span></div>
              </div>

              <div className="result-block">
                <h4><FiCreditCard /> Thanh Toán & Chi Phí</h4>
                <div className="info-line"><span>Trạng thái:</span> <span className="badge badge-yellow">{getPaymentLabel(booking.paymentStatus)}</span></div>
                <div className="info-line"><span>Hình thức:</span> <span>{booking.paymentMethod}</span></div>
                <div className="info-line price-highlight">
                  <span>Tổng thanh toán:</span>
                  <strong>{formatPrice(booking.totalPrice)}</strong>
                </div>
              </div>
            </div>

            <div className="result-footer-note">
              <span>Mọi thay đổi hoặc yêu cầu hỗ trợ đặc biệt, xin vui lòng liên hệ hotline 24/7: <strong>+84 258 123 4567</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingLookupPage;
