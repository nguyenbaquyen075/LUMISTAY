import React, { useState } from 'react';
import './NestaSliderGallery.css';

const SERVICES = [
  {
    id: 1,
    name: 'nhà hàng la palace',
    desc: 'La Palace mang hơi thở truyền thống Việt, thể hiện trọn vẹn tinh thần ấy từ không gian đến từng món ăn hảo hạng, kết hợp tinh tế ẩm thực Á - Âu.',
    image: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/Buffet_8-1-1.webp'
  },
  {
    id: 2,
    name: 'LumiStay Spa & Wellness',
    desc: 'LumiStay Spa là không gian dành riêng cho sự thư giãn và tái tạo năng lượng, nơi cơ thể và tâm trí được trở về trạng thái cân bằng tự nhiên với các liệu pháp trị liệu chuyên sâu.',
    image: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/47377794_1793335897462144_2359005599007506432_n-1.webp'
  }
];

const NestaSliderGallery = () => {
  const [activeIdx, setActiveIdx] = useState(0);

  const next = () => setActiveIdx((activeIdx + 1) % SERVICES.length);
  const prev = () => setActiveIdx((activeIdx - 1 + SERVICES.length) % SERVICES.length);

  const current = SERVICES[activeIdx];

  return (
    <section className="slider-gallery">
      <div className="slider-gallery-bg reveal-up">
        <img 
          src={current.image} 
          alt={current.name} 
          className="slider-gallery-image"
        />
        <div className="slider-gallery-overlay"></div>
      </div>

      <div className="slider-gallery-content">
        <div className="slider-gallery-card reveal-up reveal-delay-2">
          <span className="card-badge">DỊCH VỤ NỔI BẬT</span>
          <h3 className="name-room">{current.name}</h3>
          <p className="description">{current.desc}</p>

          <div className="card-controls">
            <div className="swiper-arrows">
              <button className="swiper-arrow arrow-prev" onClick={prev} aria-label="Previous">
                <svg width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 5.5C4 4.5 7 1 7 0M1 5.5C4 6.5 7 10 7 11M1 5.5H14" stroke="currentColor" strokeLinejoin="bevel" />
                </svg>
              </button>
              <button className="swiper-arrow arrow-next" onClick={next} aria-label="Next">
                <svg width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 5.5C10 4.5 7 1 7 0M13 5.5C10 6.5 7 10 7 11M13 5.5H0" stroke="currentColor" strokeLinejoin="bevel" />
                </svg>
              </button>
            </div>

            <div className="indicator-dots">
              {SERVICES.map((s, i) => (
                <span 
                  key={s.id} 
                  className={`dot ${i === activeIdx ? 'active' : ''}`}
                  onClick={() => setActiveIdx(i)}
                ></span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NestaSliderGallery;
