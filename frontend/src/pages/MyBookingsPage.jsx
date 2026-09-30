import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { FiCalendar, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatPrice, getStatusColor, getStatusLabel, getPaymentLabel } from '../utils/helpers';
import './BookingLookupPage.css';

const MyBookingsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyBookings = async () => {
      try {
        const res = await api.get('/bookings');
        if (res.data.bookings) {
          setBookings(res.data.bookings);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchMyBookings();
  }, [user]);

  if (authLoading) return <div className="loading-container"><div className="loading-spinner"></div></div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="booking-lookup-page">
      <div className="page-header-banner">
        <div className="banner-overlay"></div>
        <div className="container banner-content">
          <span className="section-label">TÀI KHOẢN CỦA TÔI</span>
          <h1 className="banner-title">Lịch Sử Đặt Phòng</h1>
          <p className="banner-sub">Xin chào, {user.name}! Dưới đây là các đơn đặt phòng của bạn tại LumiStay.</p>
        </div>
      </div>

      <div className="container lookup-container">
        {loading ? (
          <div className="loading-container"><div className="loading-spinner"></div></div>
        ) : bookings.length === 0 ? (
          <div className="booking-result-card" style={{ textAlign: 'center' }}>
            <h3>Bạn chưa có đơn đặt phòng nào</h3>
            <p style={{ margin: '14px 0 24px', color: '#64748b' }}>Hãy khám phá các hạng phòng sang trọng tại LumiStay và đặt kỳ nghỉ của bạn ngay hôm nay!</p>
            <Link to="/rooms" className="btn btn-primary">Khám phá phòng ngay</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {bookings.map(b => (
              <div key={b._id} className="booking-result-card">
                <div className="result-header">
                  <div>
                    <span className="res-code-label">MÃ ĐẶT PHÒNG:</span>
                    <h3 className="res-code-val">{b.bookingCode}</h3>
                  </div>
                  <span className={`badge ${getStatusColor(b.status)} res-status-badge`}>
                    {getStatusLabel(b.status)}
                  </span>
                </div>

                <div className="result-grid">
                  <div className="result-block">
                    <h4>Hạng phòng</h4>
                    <div className="info-line"><strong>{b.room?.name || 'Phòng'}</strong></div>
                    <div className="info-line"><span>{b.nights} đêm lưu trú</span></div>
                  </div>
                  <div className="result-block">
                    <h4>Thời gian</h4>
                    <div className="info-line"><span>Nhận: {new Date(b.checkIn).toLocaleDateString('vi-VN')}</span></div>
                    <div className="info-line"><span>Trả: {new Date(b.checkOut).toLocaleDateString('vi-VN')}</span></div>
                  </div>
                  <div className="result-block">
                    <h4>Chi phí</h4>
                    <div className="info-line price-highlight">
                      <span>Tổng tiền:</span>
                      <strong>{formatPrice(b.totalPrice)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookingsPage;
