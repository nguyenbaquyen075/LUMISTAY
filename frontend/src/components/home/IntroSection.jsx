import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import './IntroSection.css';

const IntroSection = () => {
  return (
    <section id="gioi-thieu" className="intro-section section-cream">
      <div className="container">
        <div className="intro-grid">
          {/* Left Text Block */}
          <div className="intro-text-side">
            <span className="section-label">GIỚI THIỆU KHÁCH SẠN</span>
            <h2 className="section-title">
              Nơi tinh hoa <br />
              hội tụ cùng thiên nhiên
            </h2>
            <p className="intro-paragraph">
              LumiStay toạ lạc tại vị trí đắc địa bên bờ biển, nơi giao thoa giữa vẻ đẹp thiên nhiên hoang sơ và kiến trúc hiện đại. Chúng tôi mang đến không gian nghỉ dưỡng đẳng cấp, dịch vụ tận tâm và những trải nghiệm độc đáo, giúp bạn tận hưởng trọn vẹn từng khoảnh khắc.
            </p>
            <Link to="/rooms" className="btn btn-secondary intro-btn">
              <span>Khám phá thêm</span>
              <FiArrowRight />
            </Link>
          </div>

          {/* Right Visual Grid: 3-item display */}
          <div className="intro-visual-grid">
            {/* Big Landscape Image */}
            <div className="visual-card visual-card-main">
              <img 
                src="/images/resort-architecture.jpg" 
                alt="LumiStay Resort Architecture" 
                className="visual-img"
              />
              <div className="visual-overlay"></div>
            </div>

            {/* Dark Stats Card */}
            <div className="visual-card visual-card-stats">
              <div className="stats-inner">
                <div className="stat-box">
                  <div className="stat-number">5★</div>
                  <div className="stat-label">Tiêu chuẩn khách sạn</div>
                </div>

                <div className="stat-divider"></div>

                <div className="stat-box">
                  <div className="stat-number">120</div>
                  <div className="stat-label">Phòng & biệt thự cao cấp</div>
                </div>

                <div className="stat-divider"></div>

                <div className="stat-box">
                  <div className="stat-number">800+</div>
                  <div className="stat-label">Khách hàng hài lòng mỗi năm</div>
                </div>

                <div className="stats-brand">
                  <span className="stats-brand-title">LumiStay</span>
                  <span className="stats-brand-sub">More than a stay</span>
                </div>
              </div>
            </div>

            {/* Vertical Lobby Image */}
            <div className="visual-card visual-card-lobby">
              <img 
                src="/images/hotel-lobby.jpg" 
                alt="LumiStay Luxury Lobby" 
                className="visual-img"
              />
              <div className="visual-overlay"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntroSection;
