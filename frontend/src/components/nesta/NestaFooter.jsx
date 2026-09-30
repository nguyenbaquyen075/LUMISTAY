import React, { useState } from 'react';
import { FiFacebook, FiInstagram, FiYoutube } from 'react-icons/fi';
import './NestaFooter.css';

const NestaFooter = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail('');
      setSubscribed(false);
    }, 4000);
  };

  return (
    <footer id="footer" className="footer-nesta">
      <div className="footer-container">
        <div className="footer-main">
          <div className="footer-top row g-0">
            {/* Logo Column */}
            <div className="col-lg-2 col-md-12 footer-left reveal-up">
              <a href="/" className="footer-logo">
                <div className="footer-brand-logo">
                  <span className="brand-emblem-footer">✧</span>
                  <span className="brand-title-footer">LUMISTAY</span>
                  <span className="brand-sub-footer">LUXURY HOTEL</span>
                </div>
              </a>
            </div>

            {/* Content Columns */}
            <div className="col-lg-10 col-md-12 footer-right">
              {/* Hotel Contact */}
              <div className="footer-col footer-address reveal-up reveal-delay-1">
                <div className="column-title text-uppercase">
                  LumiStay Hanoi Hotel
                </div>
                <ul>
                  <li className="body-1 color-white">
                    <div className="icon">
                      <img src="https://nestahotel.com.vn/wp-content/themes/nesta/assets/images/icons/icon-location.svg" alt="" />
                    </div>
                    <span>30 Nguyễn Thượng Hiền, Hai Bà Trưng, Hà Nội</span>
                  </li>
                  <li className="body-1 color-white">
                    <div className="icon">
                      <img src="https://nestahotel.com.vn/wp-content/themes/nesta/assets/images/icons/icon-phone.svg" alt="" />
                    </div>
                    <a href="tel:+842439418888">+84 24 3941 8888</a>
                  </li>
                  <li className="body-1 color-white">
                    <div className="icon">
                      <img src="https://nestahotel.com.vn/wp-content/themes/nesta/assets/images/icons/icon-mail.svg" alt="" />
                    </div>
                    <a href="mailto:contact@lumistay.com">contact@lumistay.com</a>
                  </li>
                </ul>
              </div>

              {/* Hotel Chain */}
              <div className="footer-col footer-brands reveal-up reveal-delay-2">
                <div className="column-title text-uppercase">
                  chuỗi khách sạn
                </div>
                <ul>
                  <li><a href="#accommodation-detail" className="active">LumiStay Hanoi Luxury Hotel</a></li>
                  <li><a href="#accommodation-detail">LumiStay Saigon Central</a></li>
                  <li><a href="#accommodation-detail">LumiStay Danang Beach Resort</a></li>
                  <li><a href="#accommodation-detail">LumiStay Dalat Pine Valley</a></li>
                  <li><a href="#accommodation-detail">LumiStay Hoian Heritage Resort</a></li>
                </ul>
              </div>

              {/* Navigation Links */}
              <div className="footer-col footer-menu reveal-up reveal-delay-3">
                <div className="column-title text-uppercase">
                  về chúng tôi
                </div>
                <ul>
                  <li><a href="#featured-offers">Ưu đãi</a></li>
                  <li><a href="#accommodation-type">Hạng phòng</a></li>
                  <li><a href="#section-gallery">Thư viện</a></li>
                  <li><a href="#destination-location">Vị trí điểm đến</a></li>
                  <li><a href="/booking-lookup">Tra cứu đặt phòng</a></li>
                </ul>
              </div>

              {/* Newsletter */}
              <div className="footer-col footer-newsletter reveal-up reveal-delay-4">
                <div className="column-title text-uppercase">
                  Đăng ký nhận bản tin
                </div>

                {subscribed ? (
                  <div className="newsletter-success-msg">
                    ✓ Cảm ơn quý khách đã đăng ký nhận thông tin ưu đãi từ Nesta Hotel!
                  </div>
                ) : (
                  <form className="form newsletter-form" onSubmit={handleSubscribe}>
                    <div className="field-item">
                      <input 
                        type="email" 
                        name="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Nhập email của bạn..." 
                        required 
                        className="body-1"
                      />
                    </div>
                    <button type="submit">
                      <span>Gửi ngay</span>
                      <div className="icon">
                        <svg width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13 5.5C10 4.5 7 1 7 0M13 5.5C10 6.5 7 10 7 11M13 5.5H0" stroke="currentColor" strokeLinejoin="bevel" />
                        </svg>
                      </div>
                    </button>
                  </form>
                )}

                <div className="footer-social">
                  <span className="social-label">KẾT NỐI VỚI CHÚNG TÔI:</span>
                  <div className="social-icons">
                    <a href="https://www.facebook.com/nestahotelhanoi.nth" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                      <FiFacebook />
                    </a>
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                      <FiInstagram />
                    </a>
                    <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="Youtube">
                      <FiYoutube />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p>© 2026 LumiStay Hotel &amp; Residences. All rights reserved. Bản quyền thuộc về LumiStay Hotel.</p>
          <div className="footer-legal">
            <a href="#chinh-sach">Chính sách bảo mật</a>
            <span>•</span>
            <a href="#dieu-khoan">Điều khoản sử dụng</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default NestaFooter;
