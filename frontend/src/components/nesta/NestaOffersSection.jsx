import React, { useState } from 'react';
import './NestaOffersSection.css';

const OFFERS = [
  {
    id: 1,
    tag: 'Hà Nội',
    title: 'TIỆC TRỌN GÓI 450.000 VNĐ/KHÁCH',
    desc: 'Kết nối trọn vẹn mọi khoảnh khắc',
    image: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/4-2-1.webp'
  },
  {
    id: 2,
    tag: 'Hà Nội',
    title: 'LUMISTAY SPA & WELLNESS',
    desc: 'ƯU ĐÃI GIẢM 20% cho tất cả liệu trình spa',
    image: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/47377794_1793335897462144_2359005599007506432_n-1.webp'
  },
  {
    id: 3,
    tag: 'Hà Nội',
    title: 'TINH HOA ẨM THỰC VIỆT',
    desc: 'Khơi dậy vị giác với những món ăn đậm đà bản sắc tại LumiStay Hanoi.',
    image: 'https://nestahotel.com.vn/wp-content/uploads/2026/05/Website-1250x1560px-Tinh-hoa-mon-Viet-Hanoi.jpg'
  }
];

const NestaOffersSection = ({ onOpenBookingModal }) => {
  const [selectedOffer, setSelectedOffer] = useState(null);

  return (
    <section id="featured-offers" className="featured-offers">
      <div className="section-wrapper">
        <div className="section-top d-flex align-items-center justify-content-between reveal-up">
          <h2 className="title heading-1 effect-line">
            ưu đãi nổi bật
          </h2>
        </div>

        <div className="offer-main">
          <div className="offer-grid">
            {OFFERS.map(offer => (
              <div 
                key={offer.id} 
                className="offer-item"
                onClick={() => setSelectedOffer(offer)}
              >
                <div className="tag btn-body-font color-gray-2">
                  {offer.tag}
                </div>

                <div className="image reveal-up">
                  <img 
                    src={offer.image} 
                    alt={offer.title} 
                    className="item__image" 
                    loading="lazy" 
                  />
                  <div className="overlay-gradient"></div>
                </div>

                <div className="content reveal-up reveal-delay-2">
                  <div className="content-title color-white">
                    {offer.title}
                  </div>
                  <div className="content-desc body-1 color-white">
                    {offer.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Offer Modal */}
      {selectedOffer && (
        <div className="nesta-modal-backdrop" onClick={() => setSelectedOffer(null)}>
          <div className="nesta-modal-content offer-modal-box" onClick={e => e.stopPropagation()}>
            <button className="nesta-modal-close" onClick={() => setSelectedOffer(null)}>
              <svg width="18" height="18" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.3535 0.353516L0.353516 12.3535" stroke="#181819" strokeWidth="1.5" />
                <path d="M0.353516 0.353516L12.3535 12.3535" stroke="#181819" strokeWidth="1.5" />
              </svg>
            </button>

            <img src={selectedOffer.image} alt={selectedOffer.title} className="offer-modal-banner" />
            
            <div className="offer-modal-info">
              <span className="offer-modal-tag">{selectedOffer.tag}</span>
              <h3 className="offer-modal-title">{selectedOffer.title}</h3>
              <p className="offer-modal-desc">{selectedOffer.desc}</p>
              <p className="offer-modal-detail">
                Chương trình áp dụng độc quyền cho khách hàng đặt phòng trực tiếp tại LumiStay Hanoi Hotel 
                hoặc liên hệ qua Hotline <strong>+84 24 3941 8888</strong>.
              </p>

              <button 
                className="button-global mt-3"
                onClick={() => {
                  setSelectedOffer(null);
                  onOpenBookingModal && onOpenBookingModal();
                }}
              >
                <span>NHẬN ƯU ĐÃI NGAY</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default NestaOffersSection;
