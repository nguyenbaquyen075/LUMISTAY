import React from 'react';
import { Link } from 'react-router-dom';
import { FiPhone, FiMail, FiMapPin, FiFacebook, FiInstagram, FiYoutube, FiArrowUp } from 'react-icons/fi';
import './Footer.css';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer-section">
      <div className="container">
        <div className="footer-grid">
          {/* Col 1: Brand & Intro */}
          <div className="footer-col brand-col">
            <div className="brand-logo-mark">
              <span className="brand-icon">✧</span>
              <div className="brand-text">
                <span className="brand-title">LumiStay</span>
                <span className="brand-subtitle">Hotel & Resort</span>
              </div>
            </div>
            <p className="footer-desc">
              LumiStay là điểm đến lý tưởng cho những ai tìm kiếm sự tinh tế, thoải mái và riêng tư trong từng khoảnh khắc nghỉ dưỡng 5 sao bên bờ biển.
            </p>
            <div className="footer-socials">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook"><FiFacebook /></a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><FiInstagram /></a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="Youtube"><FiYoutube /></a>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="footer-col">
            <h4 className="footer-title">Khám Phá</h4>
            <ul className="footer-links">
              <li><Link to="/">Trang chủ</Link></li>
              <li><a href="/#gioi-thieu">Giới thiệu</a></li>
              <li><Link to="/rooms">Phòng & Biệt thự</Link></li>
              <li><a href="/#dich-vu">Dịch vụ 5 sao</a></li>
              <li><a href="/#dich-vu">Ẩm thực cao cấp</a></li>
              <li><Link to="/booking-lookup">Tra cứu đặt phòng</Link></li>
            </ul>
          </div>

          {/* Col 3: Room types */}
          <div className="footer-col">
            <h4 className="footer-title">Hạng Phòng</h4>
            <ul className="footer-links">
              <li><Link to="/rooms?type=Deluxe">Deluxe Ocean View</Link></li>
              <li><Link to="/rooms?type=Premier+Suite">Premier Suite</Link></li>
              <li><Link to="/rooms?type=Family+Room">Family Room</Link></li>
              <li><Link to="/rooms?type=Villa">Villa View Biển</Link></li>
              <li><Link to="/rooms">Tất cả phòng & bảng giá</Link></li>
            </ul>
          </div>

          {/* Col 4: Contact info */}
          <div className="footer-col contact-col">
            <h4 className="footer-title">Liên Hệ</h4>
            <div className="contact-item">
              <FiMapPin className="contact-icon" />
              <span>123 Đường Trần Phú, Lộc Thọ, Nha Trang, Khánh Hòa</span>
            </div>
            <div className="contact-item">
              <FiPhone className="contact-icon" />
              <span>+84 258 123 4567</span>
            </div>
            <div className="contact-item">
              <FiMail className="contact-icon" />
              <span>booking@lumistay.com</span>
            </div>
            <div className="newsletter-box">
              <p>Đăng ký nhận ưu đãi độc quyền:</p>
              <form onSubmit={(e) => { e.preventDefault(); alert('Cảm ơn bạn đã đăng ký!'); }}>
                <div className="newsletter-input-group">
                  <input type="email" placeholder="Email của bạn..." required />
                  <button type="submit">Gửi</button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} LumiStay Hotel & Resort. Mọi quyền được bảo lưu.</p>
          <div className="footer-bottom-links">
            <a href="#terms">Điều khoản sử dụng</a>
            <a href="#privacy">Chính sách bảo mật</a>
            <button className="back-to-top" onClick={scrollToTop} title="Lên đầu trang">
              <FiArrowUp />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
