import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiCalendar, FiUsers, FiSearch, FiPlay, FiMapPin, FiAward, 
  FiCpu, FiTag, FiChevronDown, FiPlus, FiMinus 
} from 'react-icons/fi';
import './HeroSection.css';

const destinations = [
  'LumiStay Nha Trang Resort & Spa',
  'LumiStay Da Nang Beach Hotel',
  'LumiStay Phu Quoc Villa & Spa',
  'LumiStay Ha Noi Boutique Hotel',
  'LumiStay Da Lat Valley Resort'
];

const HeroSection = ({ onOpenBookingModal, onOpenChatbot }) => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [destination, setDestination] = useState(destinations[0]);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);

  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [showPeopleDropdown, setShowPeopleDropdown] = useState(false);

  const [promoCode, setPromoCode] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);

  const destRef = useRef(null);
  const peopleRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (destRef.current && !destRef.current.contains(e.target)) {
        setShowDestDropdown(false);
      }
      if (peopleRef.current && !peopleRef.current.contains(e.target)) {
        setShowPeopleDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/rooms?destination=${encodeURIComponent(destination)}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&children=${children}&promo=${promoCode}`);
  };

  return (
    <section className="hero-section">
      {/* Background Image & Gradient Overlays */}
      <div className="hero-bg-wrapper">
        <img 
          src="/images/hero.jpg" 
          alt="LumiStay Luxury Resort" 
          className="hero-bg-image"
        />
        <div className="hero-overlay-gradient"></div>
      </div>

      {/* Floating Lumi AI prompt in top-right */}
      <div className="hero-ai-badge" onClick={onOpenChatbot}>
        <div className="ai-avatar">
          <span className="ai-pulse"></span>
          🤖
        </div>
        <div className="ai-text">
          <span className="ai-title">Lumi AI</span>
          <span className="ai-desc">Tôi có thể giúp gì cho bạn?</span>
        </div>
        <span className="ai-arrow">➔</span>
      </div>

      <div className="container hero-content-container">
        <div className="hero-text-content">
          <div className="hero-eyebrow">
            <span className="eyebrow-line"></span>
            <span>LUMISTAY HOTEL & RESORT</span>
          </div>

          <h1 className="hero-title">
            Trải nghiệm nghỉ dưỡng <br />
            <em>đẳng cấp vượt thời gian</em>
          </h1>

          <p className="hero-desc">
            LumiStay là điểm đến lý tưởng cho những ai tìm kiếm sự tinh tế, thoải mái và riêng tư trong từng khoảnh khắc.
          </p>

          {/* Highlights and Video Tour in one sleek row */}
          <div className="hero-features-and-video-row">
            <div className="hero-highlights">
              <div className="highlight-item">
                <div className="highlight-icon"><FiMapPin /></div>
                <div className="highlight-info">
                  <strong>Vị trí đắc địa</strong>
                  <span>Gần biển, trung tâm</span>
                </div>
              </div>

              <div className="highlight-divider"></div>

              <div className="highlight-item">
                <div className="highlight-icon"><FiAward /></div>
                <div className="highlight-info">
                  <strong>Dịch vụ 5 sao</strong>
                  <span>Chuyên nghiệp, tận tâm</span>
                </div>
              </div>

              <div className="highlight-divider"></div>

              <div className="highlight-item">
                <div className="highlight-icon"><FiCpu /></div>
                <div className="highlight-info">
                  <strong>Công nghệ AI</strong>
                  <span>Cá nhân hóa trải nghiệm</span>
                </div>
              </div>
            </div>

            {/* Video Tour Button */}
            <div className="hero-video-trigger" onClick={() => setShowVideoModal(true)}>
              <div className="play-button-glow">
                <FiPlay className="play-icon" />
              </div>
              <div className="video-text">
                <span className="video-title">Khám phá LumiStay</span>
                <span className="video-sub">Xem video giới thiệu</span>
              </div>
            </div>
          </div>
        </div>

        {/* NESTA STYLE BOOKING FORM (#bookingHotel format) */}
        <div className="hero-booking-bar nesta-booking-form-bar">
          <form onSubmit={handleSearch} className="nesta-booking-form">
            {/* 1. DESTINATION */}
            <div className="nesta-form-item" ref={destRef}>
              <div 
                className="nesta-field-btn"
                onClick={() => {
                  setShowDestDropdown(!showDestDropdown);
                  setShowPeopleDropdown(false);
                }}
              >
                <div className="nesta-field-icon">
                  <FiMapPin />
                </div>
                <div className="nesta-field-content">
                  <span className="nesta-field-label">ĐIỂM ĐẾN / KHÁCH SẠN</span>
                  <strong className="nesta-field-value">{destination}</strong>
                </div>
                <FiChevronDown className="nesta-arrow-down" />
              </div>

              {showDestDropdown && (
                <div className="nesta-dropdown-menu">
                  {destinations.map((d, i) => (
                    <div 
                      key={i} 
                      className={`nesta-dropdown-item ${d === destination ? 'is-active' : ''}`}
                      onClick={() => {
                        setDestination(d);
                        setShowDestDropdown(false);
                      }}
                    >
                      {d}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="nesta-divider"></div>

            {/* 2. DATES (Check-in & Check-out) */}
            <div className="nesta-form-item nesta-dates-item">
              <div className="nesta-field-btn">
                <div className="nesta-field-icon">
                  <FiCalendar />
                </div>
                <div className="nesta-field-content">
                  <span className="nesta-field-label">NGÀY NHẬN - TRẢ PHÒNG</span>
                  <div className="nesta-date-inputs">
                    <input 
                      type="date" 
                      value={checkIn}
                      min={today}
                      onChange={(e) => setCheckIn(e.target.value)}
                      required
                    />
                    <span className="nesta-date-sep">-</span>
                    <input 
                      type="date" 
                      value={checkOut}
                      min={checkIn || today}
                      onChange={(e) => setCheckOut(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="nesta-divider"></div>

            {/* 3. PEOPLE (Adults & Children selector) */}
            <div className="nesta-form-item" ref={peopleRef}>
              <div 
                className="nesta-field-btn"
                onClick={() => {
                  setShowPeopleDropdown(!showPeopleDropdown);
                  setShowDestDropdown(false);
                }}
              >
                <div className="nesta-field-icon">
                  <FiUsers />
                </div>
                <div className="nesta-field-content">
                  <span className="nesta-field-label">SỐ LƯỢNG KHÁCH</span>
                  <strong className="nesta-field-value">
                    {adults} Người lớn, {children} Trẻ em
                  </strong>
                </div>
                <FiChevronDown className="nesta-arrow-down" />
              </div>

              {showPeopleDropdown && (
                <div className="nesta-select-box-popup">
                  <div className="nesta-counter-row">
                    <div>
                      <strong>Người lớn</strong>
                      <small>Từ 12 tuổi trở lên</small>
                    </div>
                    <div className="nesta-counter-ctrl">
                      <button 
                        type="button" 
                        disabled={adults <= 1} 
                        onClick={() => setAdults(prev => Math.max(1, prev - 1))}
                      >
                        <FiMinus />
                      </button>
                      <span className="nesta-counter-val">{adults}</span>
                      <button 
                        type="button" 
                        onClick={() => setAdults(prev => prev + 1)}
                      >
                        <FiPlus />
                      </button>
                    </div>
                  </div>

                  <div className="nesta-counter-divider"></div>

                  <div className="nesta-counter-row">
                    <div>
                      <strong>Trẻ em</strong>
                      <small>Dưới 12 tuổi</small>
                    </div>
                    <div className="nesta-counter-ctrl">
                      <button 
                        type="button" 
                        disabled={children <= 0} 
                        onClick={() => setChildren(prev => Math.max(0, prev - 1))}
                      >
                        <FiMinus />
                      </button>
                      <span className="nesta-counter-val">{children}</span>
                      <button 
                        type="button" 
                        onClick={() => setChildren(prev => prev + 1)}
                      >
                        <FiPlus />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="nesta-divider"></div>

            {/* 4. PROMO CODE */}
            <div className="nesta-form-item nesta-promo-item">
              <div className="nesta-field-btn">
                <div className="nesta-field-icon">
                  <FiTag />
                </div>
                <div className="nesta-field-content">
                  <span className="nesta-field-label">MÃ KHUYẾN MÃI</span>
                  <input 
                    type="text" 
                    placeholder="Nhập mã ưu đãi..."
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="nesta-promo-input"
                  />
                </div>
              </div>
            </div>

            {/* 5. SUBMIT BUTTON */}
            <div className="nesta-form-item nesta-submit-item">
              <button type="submit" className="nesta-submit-btn">
                <FiSearch />
                <span>TÌM PHÒNG</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="video-modal-backdrop" onClick={() => setShowVideoModal(false)}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="video-modal-close" onClick={() => setShowVideoModal(false)}>✕</button>
            <div className="video-frame-container">
              <iframe 
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" 
                title="LumiStay Video Tour" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default HeroSection;
