import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiMaximize2, FiUser, FiDisc, FiCalendar, FiShield, FiCoffee } from 'react-icons/fi';
import api from '../utils/api';
import { formatPrice } from '../utils/helpers';
import './RoomDetailPage.css';

const RoomDetailPage = ({ onBookRoom }) => {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await api.get(`/rooms/${id}`);
        if (res.data.room) {
          setRoom(res.data.room);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [id]);

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '80vh' }}>
        <div className="loading-spinner"></div>
        <p>Đang tải chi tiết phòng...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="container" style={{ padding: '140px 20px', textAlign: 'center' }}>
        <h2>Không tìm thấy phòng này</h2>
        <Link to="/rooms" className="btn btn-primary" style={{ marginTop: '20px' }}>
          Quay lại danh sách phòng
        </Link>
      </div>
    );
  }

  return (
    <div className="room-detail-page">
      <div className="container room-detail-container">
        {/* Breadcrumb */}
        <div className="detail-breadcrumb">
          <Link to="/rooms" className="back-link">
            <FiArrowLeft /> Danh sách phòng
          </Link>
          <span className="crumb-sep">/</span>
          <span className="crumb-current">{room.name}</span>
        </div>

        {/* Gallery */}
        <div className="room-gallery-section">
          <div className="main-gallery-img">
            <img src={room.images?.[activeImage] || room.images?.[0]} alt={room.name} />
          </div>
          {room.images && room.images.length > 1 && (
            <div className="gallery-thumbs">
              {room.images.map((img, idx) => (
                <div 
                  key={idx} 
                  className={`thumb-wrap ${activeImage === idx ? 'active' : ''}`}
                  onClick={() => setActiveImage(idx)}
                >
                  <img src={img} alt={`${room.name} ${idx + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2-Column Content */}
        <div className="detail-content-grid">
          {/* Left: Info */}
          <div className="detail-main-info">
            <div className="detail-header-block">
              <span className="room-type-pill">{room.type}</span>
              <h1 className="detail-room-name">{room.name}</h1>
              <div className="detail-specs-bar">
                <div className="spec-item"><FiMaximize2 /> {room.area} m²</div>
                <div className="spec-item"><FiUser /> Tối đa {room.maxGuests} khách</div>
                <div className="spec-item"><FiDisc /> {room.bedrooms} giường lớn</div>
                <div className="spec-item">Tầng {room.floor}</div>
              </div>
            </div>

            <div className="detail-block">
              <h3 className="block-title">Mô Tả Phòng</h3>
              <p className="room-full-description">{room.description}</p>
            </div>

            <div className="detail-block">
              <h3 className="block-title">Tiện Nghi & Dịch Vụ Đi Kèm</h3>
              <div className="amenities-grid-detailed">
                {room.amenities?.map((amenity, i) => (
                  <div key={i} className="amenity-item-box">
                    <FiCheck className="check-icon" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="detail-block">
              <h3 className="block-title">Chính Sách & Quy Định</h3>
              <ul className="policy-list">
                <li><FiCalendar /> <strong>Check-in:</strong> 14:00 | <strong>Check-out:</strong> 12:00</li>
                <li><FiCoffee /> <strong>Bữa sáng:</strong> Miễn phí buffet sáng hàng ngày từ 06:00 - 10:00</li>
                <li><FiShield /> <strong>Hủy phòng:</strong> Miễn phí hủy trước 48h so với ngày nhận phòng</li>
                <li>🚭 Không hút thuốc trong phòng nghỉ</li>
              </ul>
            </div>
          </div>

          {/* Right: Sticky Booking Card */}
          <div className="detail-booking-sidebar">
            <div className="sticky-booking-card">
              <div className="sidebar-price-header">
                <div className="sidebar-price-left">
                  <span className="price-big">{formatPrice(room.price)}</span>
                  <span className="price-sub">/ đêm</span>
                </div>
                <span className="badge badge-green">Còn phòng</span>
              </div>

              <div className="sidebar-features-list">
                <div className="feat-line">✓ Bao gồm bữa sáng buffet 5 sao</div>
                <div className="feat-line">✓ Miễn phí sử dụng hồ bơi vô cực</div>
                <div className="feat-line">✓ Trà & cà phê đón tiếp miễn phí</div>
                <div className="feat-line">✓ Dịch vụ dọn phòng 2 lần/ngày</div>
              </div>

              <button 
                className="btn btn-primary btn-lg w-full"
                onClick={() => onBookRoom && onBookRoom(room)}
              >
                Đặt Phòng Ngay
              </button>

              <div className="sidebar-support-note">
                <span>Cần tư vấn thêm? Gọi Hotline:</span>
                <strong>+84 258 123 4567</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetailPage;
