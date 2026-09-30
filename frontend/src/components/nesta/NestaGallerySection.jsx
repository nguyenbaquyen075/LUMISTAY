import React, { useState } from 'react';
import './NestaGallerySection.css';

const GALLERY_PHOTOS = [
  {
    id: 1,
    title: 'Tổng quan Nesta Hanoi',
    category: 'tong-quan',
    categoryName: 'Tổng quan',
    src: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/Overview_1-1-1.webp'
  },
  {
    id: 2,
    title: 'Phòng Deluxe sang trọng',
    category: 'phong',
    categoryName: 'Hạng phòng',
    src: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/73098132_2359191180876610_3678810497441857536_n-1.webp'
  },
  {
    id: 3,
    title: 'Phòng Executive tầm nhìn phố',
    category: 'phong',
    categoryName: 'Hạng phòng',
    src: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/Executive-1.webp'
  },
  {
    id: 4,
    title: 'Dịch vụ Nesta Spa',
    category: 'spa-am-thuc',
    categoryName: 'Spa & Ẩm thực',
    src: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/Spa_2-1-1.webp'
  },
  {
    id: 5,
    title: 'Không gian Nhà hàng La Palace',
    category: 'spa-am-thuc',
    categoryName: 'Spa & Ẩm thực',
    src: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/z3227547725041_ad3ada6edba452c8b089f501e2e5cfc9-1.webp'
  },
  {
    id: 6,
    title: 'Sảnh đón tiếp Lễ tân',
    category: 'tong-quan',
    categoryName: 'Tổng quan',
    src: 'https://nestahotel.com.vn/wp-content/uploads/2026/02/Reception_3-1-1.webp'
  }
];

const NestaGallerySection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [lightboxImg, setLightboxImg] = useState(null);

  const filteredPhotos = activeTab === 'all' 
    ? GALLERY_PHOTOS 
    : GALLERY_PHOTOS.filter(p => p.category === activeTab);

  return (
    <section id="section-gallery" className="section-gallery">
      <div className="section-wrapper">
        <div className="section-top d-flex align-items-center justify-content-between reveal-up">
          <h2 className="title heading-1 effect-line">thư viện</h2>

          <div className="btn-wrapper">
            <button
              className="btn-arrow text-uppercase color-black"
              type="button"
              onClick={() => setIsModalOpen(true)}
            >
              <span>xem tất cả</span>
              <div className="icon">
                <svg width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 5.5C10 4.5 7 1 7 0M13 5.5C10 6.5 7 10 7 11M13 5.5H0" stroke="#181819" strokeLinejoin="bevel" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* 6 Photo Grid */}
        <div className="gallery-grid">
          {GALLERY_PHOTOS.map(item => (
            <div 
              key={item.id} 
              className="gallery-grid__item reveal-up"
              onClick={() => setLightboxImg(item)}
            >
              <img src={item.src} alt={item.title} loading="lazy" />
              <div className="item-overlay reveal-up reveal-delay-2">
                <span>{item.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gallery Modal */}
      {isModalOpen && (
        <div className="nesta-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="nesta-modal-content gallery-modal-content" onClick={e => e.stopPropagation()}>
            <div className="gallery-modal-header">
              <h3 className="gallery-modal-title">THƯ VIỆN HÌNH ẢNH LUMISTAY HANOI</h3>
              <button className="nesta-modal-close" onClick={() => setIsModalOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.3535 0.353516L0.353516 12.3535" stroke="#181819" strokeWidth="1.5" />
                  <path d="M0.353516 0.353516L12.3535 12.3535" stroke="#181819" strokeWidth="1.5" />
                </svg>
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="gallery-filter-tabs">
              <button 
                className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                Tất cả
              </button>
              <button 
                className={`tab-btn ${activeTab === 'tong-quan' ? 'active' : ''}`}
                onClick={() => setActiveTab('tong-quan')}
              >
                Tổng quan
              </button>
              <button 
                className={`tab-btn ${activeTab === 'phong' ? 'active' : ''}`}
                onClick={() => setActiveTab('phong')}
              >
                Phòng nghỉ
              </button>
              <button 
                className={`tab-btn ${activeTab === 'spa-am-thuc' ? 'active' : ''}`}
                onClick={() => setActiveTab('spa-am-thuc')}
              >
                Nhà hàng & Spa
              </button>
            </div>

            {/* Photos Grid inside Modal */}
            <div className="modal-photos-grid">
              {filteredPhotos.map(item => (
                <div 
                  key={item.id} 
                  className="modal-photo-card"
                  onClick={() => setLightboxImg(item)}
                >
                  <img src={item.src} alt={item.title} />
                  <div className="photo-title-bar">{item.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Preview */}
      {lightboxImg && (
        <div className="lightbox-backdrop" onClick={() => setLightboxImg(null)}>
          <div className="lightbox-container" onClick={e => e.stopPropagation()}>
            <img src={lightboxImg.src} alt={lightboxImg.title} className="lightbox-img" />
            <div className="lightbox-caption">{lightboxImg.title}</div>
            <button className="lightbox-close" onClick={() => setLightboxImg(null)}>✕</button>
          </div>
        </div>
      )}
    </section>
  );
};

export default NestaGallerySection;
