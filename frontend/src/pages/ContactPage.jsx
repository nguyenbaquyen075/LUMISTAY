import React, { useState } from 'react';
import { FiMapPin, FiPhone, FiMail, FiClock, FiSend, FiCheckCircle } from 'react-icons/fi';
import api from '../utils/api';
import './ContactPage.css';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/contact', formData);
      if (res.data.success) {
        setSubmitted(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi gửi tin nhắn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <div className="page-header-banner">
        <div className="banner-overlay"></div>
        <div className="container banner-content">
          <span className="section-label">LIÊN HỆ & HỖ TRỢ</span>
          <h1 className="banner-title">Kết Nối Với LumiStay</h1>
          <p className="banner-sub">
            Chúng tôi luôn sẵn sàng lắng nghe và giải đáp mọi thắc mắc của quý khách để mang đến trải nghiệm nghỉ dưỡng hoàn hảo nhất.
          </p>
        </div>
      </div>

      <div className="container contact-container">
        <div className="contact-grid-main">
          {/* Left: Info & Map */}
          <div className="contact-info-card">
            <h3 className="card-heading">Thông Tin Liên Hệ</h3>
            <p className="card-sub">Hãy ghé thăm hoặc liên hệ với chúng tôi qua các kênh dưới đây:</p>

            <div className="contact-items-list">
              <div className="c-item">
                <div className="c-icon"><FiMapPin /></div>
                <div>
                  <strong>Địa chỉ</strong>
                  <p>123 Đường Trần Phú, Lộc Thọ, TP. Nha Trang, Khánh Hòa</p>
                </div>
              </div>

              <div className="c-item">
                <div className="c-icon"><FiPhone /></div>
                <div>
                  <strong>Hotline Đặt Phòng & CSKH</strong>
                  <p>+84 258 123 4567 (Hỗ trợ 24/7)</p>
                </div>
              </div>

              <div className="c-item">
                <div className="c-icon"><FiMail /></div>
                <div>
                  <strong>Email</strong>
                  <p>booking@lumistay.com • info@lumistay.com</p>
                </div>
              </div>

              <div className="c-item">
                <div className="c-icon"><FiClock /></div>
                <div>
                  <strong>Thời Gian Phục Vụ</strong>
                  <p>Lễ tân mở cửa 24/7 • Check-in 14:00 - Check-out 12:00</p>
                </div>
              </div>
            </div>

            {/* Map Frame */}
            <div className="map-wrapper">
              <iframe 
                title="LumiStay Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d124806.31976077395!2d109.1171887342617!3d12.23880562308722!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317067756f7095a9%3A0xb35a909d73d63b2a!2zVHLhuqduIFBow7osIE5oYSBUcmFuZywgS2jDoW5oIEjDsmE!5e0!3m2!1svi!2svn!4v1700000000000!5m2!1svi!2svn"
                width="100%" 
                height="220" 
                style={{ border: 0, borderRadius: '12px' }} 
                allowFullScreen="" 
                loading="lazy"
              ></iframe>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="contact-form-card">
            {submitted ? (
              <div className="contact-success-state">
                <FiCheckCircle className="c-success-icon" />
                <h3>Gửi Tin Nhắn Thành Công!</h3>
                <p>Cảm ơn quý khách đã liên hệ. Đội ngũ chăm sóc khách hàng của LumiStay sẽ phản hồi lại trong vòng 24 giờ làm việc.</p>
                <button className="btn btn-primary" onClick={() => setSubmitted(false)}>
                  Gửi tin nhắn khác
                </button>
              </div>
            ) : (
              <>
                <h3 className="card-heading">Gửi Tin Nhắn Trực Tiếp</h3>
                <p className="card-sub">Điền vào biểu mẫu dưới đây, chúng tôi sẽ liên hệ lại sớm nhất.</p>

                {error && <div className="error-alert">{error}</div>}

                <form onSubmit={handleSubmit} className="c-form">
                  <div className="form-group">
                    <label className="form-label">Họ và Tên</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Nguyễn Văn A" 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required 
                    />
                  </div>

                  <div className="c-form-row">
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input 
                        type="email" 
                        className="form-input" 
                        placeholder="email@example.com" 
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required 
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Số Điện Thoại</label>
                      <input 
                        type="tel" 
                        className="form-input" 
                        placeholder="0912 345 678" 
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Chủ Đề</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Hỏi về dịch vụ, đặt tiệc, phản hồi..." 
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nội Dung Tin Nhắn</label>
                    <textarea 
                      className="form-input" 
                      rows="5" 
                      placeholder="Nhập nội dung cần hỗ trợ chi tiết..." 
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    ></textarea>
                  </div>

                  <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
                    <FiSend /> {loading ? 'Đang gửi...' : 'Gửi Tin Nhắn'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
