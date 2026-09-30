import React from 'react';
import { FiArrowRight, FiFacebook, FiInstagram, FiYoutube } from 'react-icons/fi';
import './CtaBanner.css';

const CtaBanner = ({ onOpenBookingModal }) => {
  return (
    <section className="cta-banner-section">
      <div className="cta-bg-overlay"></div>
      <div className="container cta-container">
        {/* Brand Left */}
        <div className="cta-brand">
          <span className="cta-brand-icon">✧</span>
          <div className="cta-brand-text">
            <span className="cta-brand-title">LumiStay</span>
            <span className="cta-brand-sub">More than a stay</span>
          </div>
        </div>

        {/* Center message & button */}
        <div className="cta-center">
          <h3 className="cta-heading">Sẵn sàng cho kỳ nghỉ trong mơ?</h3>
          <p className="cta-subheading">Đặt phòng ngay hôm nay để tận hưởng những ưu đãi đặc biệt từ LumiStay.</p>
          <button className="btn btn-outline-white cta-btn" onClick={onOpenBookingModal}>
            <span>Đặt phòng ngay</span>
            <FiArrowRight />
          </button>
        </div>

        {/* Social Right */}
        <div className="cta-socials">
          <a href="https://facebook.com" target="_blank" rel="noreferrer"><FiFacebook /></a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer"><FiInstagram /></a>
          <a href="https://youtube.com" target="_blank" rel="noreferrer"><FiYoutube /></a>
        </div>
      </div>
    </section>
  );
};

export default CtaBanner;
