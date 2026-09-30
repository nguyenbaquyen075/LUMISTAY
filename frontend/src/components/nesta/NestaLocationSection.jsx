import React, { useState } from 'react';
import './NestaLocationSection.css';

const LANDMARKS = [
  {
    id: 1,
    name: 'Lăng Chủ Tịch',
    time: '2.4km',
    type: 'van-hoa',
    image: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/location-img-4-300x169.png'
  },
  {
    id: 2,
    name: 'Nhà Tù Hỏa Lò',
    time: '850m',
    type: 'van-hoa',
    image: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/nha-tu-hoa-lo-banner-300x136.jpg'
  },
  {
    id: 3,
    name: 'Chùa Một Cột',
    time: '1.9km',
    type: 'van-hoa',
    image: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/chua-mot-cot-5-300x200.webp'
  },
  {
    id: 4,
    name: 'Nhà Thờ Lớn Hà Nội',
    time: '1.4km',
    type: 'van-hoa',
    image: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/7-0009-TOAN-CANH-NGOAI-2048x1440-1-300x211.webp'
  },
  {
    id: 5,
    name: 'Bảo Tàng Dân Tộc Học',
    time: '5.0km',
    type: 'van-hoa',
    image: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/Dan_toc_hoc_1-300x225.webp'
  },
  {
    id: 6,
    name: 'Văn Miếu Quốc Tử Giám',
    time: '1.2km',
    type: 'van-hoa',
    image: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/van-mieu-quoc-tu-giam_1752765746-300x178.jpg'
  },
  {
    id: 7,
    name: 'G7 Mart',
    time: '100m',
    type: 'mua-sam',
    image: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/location-img-4-300x169.png'
  },
  {
    id: 8,
    name: 'Công viên Thống Nhất',
    time: '60m',
    type: 'ngoai-troi',
    image: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/Overview_1-1-1.webp'
  },
  {
    id: 9,
    name: 'Hồ Thiền Quang',
    time: '410m',
    type: 'ngoai-troi',
    image: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/Overview_1-1-1.webp'
  },
  {
    id: 10,
    name: 'Rạp xiếc Trung Ương',
    time: '240m',
    type: 'giai-tri',
    image: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/location-img-4-300x169.png'
  }
];

const NestaLocationSection = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const filteredLandmarks = filterType === 'all' 
    ? LANDMARKS 
    : LANDMARKS.filter(item => item.type === filterType);

  return (
    <section id="destination-location" className="destination-location">
      <div className="section-wrapper">
        <h2 className="destination-title effect-line heading-1 reveal-up">vị trí điểm đến</h2>

        <div className="destination-wrapper">
          {/* Left: Google Map Iframe */}
          <div className="location-iframe reveal-up">
            <div className="iframe">
              <iframe
                title="Bản đồ LumiStay Hanoi Luxury Hotel"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.342566503815!2d105.8372846967896!3d21.0189748!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab8fe857f7dd%3A0x493858ea1f34098a!2sNesta%20Hotel%20Hanoi!5e0!3m2!1sen!2s!4v1770706170987!5m2!1sen!2s"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>

          {/* Right: Key Nearby Spots */}
          <div className="location-review">
            <div className="location-list">
              {LANDMARKS.slice(0, 4).map(item => (
                <div key={item.id} className="location-item reveal-up">
                  <div className="location-image reveal-up">
                    <img src={item.image} alt={item.name} loading="lazy" />
                  </div>
                  <div className="location-info reveal-up reveal-delay-2">
                    <div className="name">{item.name}</div>
                    <div className="time">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="btn-arrow text-uppercase color-black"
              type="button"
              onClick={() => setModalOpen(true)}
            >
              <span>xem thêm</span>
              <div className="icon">
                <svg width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 5.5C10 4.5 7 1 7 0M13 5.5C10 6.5 7 10 7 11M13 5.5H0" stroke="#181819" strokeLinejoin="bevel" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Location Modal */}
      {modalOpen && (
        <div className="nesta-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="nesta-modal-content location-modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header d-flex justify-content-between align-items-center">
              <h5 className="modal-title">Đi đâu gần đây</h5>
              <button
                type="button"
                className="btn-close-custom"
                onClick={() => setModalOpen(false)}
              >
                <svg width="14" height="14" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.3535 0.353516L0.353516 12.3535" stroke="#181819" strokeWidth="1.5" />
                  <path d="M0.353516 0.353516L12.3535 12.3535" stroke="#181819" strokeWidth="1.5" />
                </svg>
              </button>
            </div>

            <div className="location-filter-bar">
              <button 
                className={`loc-btn ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                Tất cả địa điểm
              </button>
              <button 
                className={`loc-btn ${filterType === 'van-hoa' ? 'active' : ''}`}
                onClick={() => setFilterType('van-hoa')}
              >
                Văn hóa
              </button>
              <button 
                className={`loc-btn ${filterType === 'mua-sam' ? 'active' : ''}`}
                onClick={() => setFilterType('mua-sam')}
              >
                Mua sắm
              </button>
              <button 
                className={`loc-btn ${filterType === 'ngoai-troi' ? 'active' : ''}`}
                onClick={() => setFilterType('ngoai-troi')}
              >
                Ngoài trời
              </button>
              <button 
                className={`loc-btn ${filterType === 'giai-tri' ? 'active' : ''}`}
                onClick={() => setFilterType('giai-tri')}
              >
                Giải trí
              </button>
            </div>

            <div className="location-popup-list">
              {filteredLandmarks.map(item => (
                <div key={item.id} className="location-popup-item">
                  <div className="location-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="location-info">
                    <div className="name">{item.name}</div>
                    <div className="time">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default NestaLocationSection;
