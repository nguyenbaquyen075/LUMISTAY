import React, { useState, useEffect } from 'react';
import './NestaAccommodationDetail.css';

const NestaAccommodationDetail = () => {
  const images = [
    { src: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/Xe_2-1-1.webp', alt: 'Nesta Hotel Car Service' },
    { src: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/Reception_5-1-1.webp', alt: 'Nesta Hotel Reception 1' },
    { src: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/Reception_4-1.webp', alt: 'Nesta Hotel Reception 2' },
    { src: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/Reception_3-1-1.webp', alt: 'Nesta Hotel Lobby' }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % images.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [images.length]);

  const nextSlide = () => setCurrentSlide((currentSlide + 1) % images.length);
  const prevSlide = () => setCurrentSlide((currentSlide - 1 + images.length) % images.length);

  const amenities = [
    { name: 'Lễ tân 24/7', icon: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/location-marker-4.svg' },
    { name: 'Buffet sáng', icon: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/location-marker-5.svg' },
    { name: 'Dịch vụ spa', icon: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/location-marker-6.svg' },
    { name: 'Bàn làm việc', icon: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/ban-lam-viec-1.svg' },
    { name: 'Phòng tắm riêng', icon: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/phong-tam-rieng.svg' },
    { name: 'TV thông minh', icon: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/TV.svg' },
    { name: 'Két sắt', icon: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/ket-an-toan.svg' },
    { name: 'Dịch vụ đón tiễn sân bay', icon: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/dua-don-san-bay-1.svg' }
  ];

  return (
    <section id="accommodation-detail" className="accommodation-detail">
      <div className="section-wrapper row g-0">
        {/* Left Column: Description & Amenities */}
        <div className="col-lg-6 col-md-12 col-left">
          <div className="detail-header-block reveal-up">
            <h2 className="title heading-1 color-black">
              LumiStay Hanoi Luxury Hotel
            </h2>
            <div className="desc body-1 color-black">
              <p>
                Tọa lạc tại vị trí đắc địa ngay trung tâm Thủ đô, LumiStay Hanoi mang đến không gian lưu trú hiện đại, thanh lịch và đậm chất văn hóa Hà Nội. Lấy cảm hứng từ vẻ đẹp cổ kính ngàn năm hòa quyện nét tinh tế đương đại, khách sạn là điểm hẹn hoàn hảo cho những kỳ nghỉ dưỡng sang trọng và chuyến công tác thành công.
              </p>
            </div>
          </div>

          <ul className="contact body-1 color-black reveal-up reveal-delay-2">
            <li>
              <div className="icon">
                <img
                  src="https://nestahotel.com.vn/wp-content/themes/nesta/assets/images/icons/icon-location-black.svg"
                  alt="Address"
                />
              </div>
              <span>30 Nguyễn Thượng Hiền, Hai Bà Trưng, Hà Nội</span>
            </li>
            <li>
              <div className="icon">
                <img
                  src="https://nestahotel.com.vn/wp-content/themes/nesta/assets/images/icons/icon-phone-black.svg"
                  alt="Phone"
                />
              </div>
              <a href="tel:+842439418888">+84 24 3941 8888</a>
            </li>
            <li>
              <div className="icon">
                <img
                  src="https://nestahotel.com.vn/wp-content/themes/nesta/assets/images/icons/icon-mail-black.svg"
                  alt="Email"
                />
              </div>
              <a href="mailto:contact@lumistay.com">contact@lumistay.com</a>
            </li>
          </ul>

          <div className="facilities body-1 color-black reveal-up reveal-delay-3">
            <h4>TIỆN ÍCH CHUNG</h4>
            <div className="facilities-wrapper">
              <ul className="facilities-main facilities-list">
                {amenities.map((item, index) => (
                  <li key={index}>
                    <div className="icon">
                      <img src={item.icon} alt={item.name} />
                    </div>
                    <span>{item.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Parallax Slider */}
        <div className="col-lg-6 col-md-12 col-right reveal-up reveal-delay-2">
          <div className="wrapper-slider-parallax position-relative">
            <div className="slider-container">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className={`slider-slide ${idx === currentSlide ? 'active' : ''}`}
                >
                  <img src={img.src} alt={img.alt} />
                </div>
              ))}
            </div>

            <div className="swiper-arrows">
              <button className="swiper-arrow arrow-prev" onClick={prevSlide} aria-label="Previous image">
                <svg width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 5.5C4 4.5 7 1 7 0M1 5.5C4 6.5 7 10 7 11M1 5.5H14" stroke="currentColor" strokeLinejoin="bevel" />
                </svg>
              </button>
              <button className="swiper-arrow arrow-next" onClick={nextSlide} aria-label="Next image">
                <svg width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 5.5C10 4.5 7 1 7 0M13 5.5C10 6.5 7 10 7 11M13 5.5H0" stroke="currentColor" strokeLinejoin="bevel" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NestaAccommodationDetail;
