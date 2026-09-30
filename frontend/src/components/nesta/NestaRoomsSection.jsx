import React, { useState, useEffect } from 'react';
import './NestaRoomsSection.css';

// Fallback high-quality rooms if API has network delay
const DEFAULT_ROOMS = [
  {
    _id: '6abd5984e2430b101fa736f3',
    id: 'room-superior',
    name: 'Phòng Superior',
    type: 'Superior',
    size: '30m2',
    bed: '1 Giường đôi lớn',
    view: 'Hướng thành phố',
    maxGuests: 2,
    price: 1250000,
    priceFormatted: '1.250.000 VNĐ / đêm',
    rating: 4.8,
    reviewCount: 95,
    badge: 'LỰA CHỌN PHỔ BIẾN',
    description: 'Không gian được thiết kế gọn gàng và yên tĩnh, trang bị đầy đủ các tiện nghi hiện đại cùng hệ thống cách âm hiệu quả. Phù hợp cho những kỳ lưu trú ngắn ngày, nơi sự thoải mái và riêng tư luôn được đặt lên hàng đầu.',
    images: [
      'https://nestahotel.com.vn/wp-content/uploads/2026/02/rt_802_2_1550028799.jpg',
      'https://nestahotel.com.vn/wp-content/uploads/2026/02/905_12-1-scaled.webp',
      'https://nestahotel.com.vn/wp-content/uploads/2026/02/905_3-1-2-scaled.jpg'
    ],
    features: [
      'Wi-Fi tốc độ cao miễn phí',
      'Điều hòa hai chiều thông minh',
      'Smart TV 50 inch truyền hình cáp',
      'Phòng tắm đứng hiện đại & vòi sen mưa',
      'Két sắt an toàn điện tử',
      'Minibar & máy sấy tóc'
    ]
  },
  {
    _id: '6abd5984e2430b101fa736f7',
    id: 'room-deluxe',
    name: 'Phòng Deluxe',
    type: 'Deluxe',
    size: '38m2',
    bed: '2 giường đơn hoặc 1 giường đôi lớn',
    view: 'Hướng thành phố',
    maxGuests: 2,
    price: 1650000,
    priceFormatted: '1.650.000 VNĐ / đêm',
    rating: 4.9,
    reviewCount: 142,
    badge: 'BÁN CHẠY NHẤT',
    description: 'Thiết kế theo phong cách tối giản hiện đại, hài hòa giữa nét tinh tế và cảm giác ấm áp. Không gian mở vừa đủ, lý tưởng để nghỉ ngơi và thư giãn sau một ngày làm việc hoặc khám phá nhịp sống Hà Nội.',
    images: [
      'https://nestahotel.com.vn/wp-content/uploads/2026/02/Sup_Delux-twin-1.webp',
      'https://nestahotel.com.vn/wp-content/uploads/2026/02/905_12-1-1.webp',
      'https://nestahotel.com.vn/wp-content/uploads/2026/02/905_6-1-1.webp'
    ],
    features: [
      'Cửa sổ lớn ngắm phố phường Hà Nội',
      'Bàn làm việc bọc da sang trọng',
      'Bồn tắm nằm & phòng tắm riêng biệt',
      'Áo choàng tắm & dép đi trong phòng',
      'Bộ đồ vệ sinh cá nhân cao cấp',
      'Bữa sáng buffet thượng hạng đi kèm'
    ]
  },
  {
    _id: '6abd5984e2430b101fa736fb',
    id: 'room-executive',
    name: 'Phòng Executive',
    type: 'Executive',
    size: '45m2',
    bed: '2 giường đơn hoặc 1 giường đôi lớn',
    view: 'Hướng thành phố',
    maxGuests: 2,
    price: 2150000,
    priceFormatted: '2.150.000 VNĐ / đêm',
    rating: 4.95,
    reviewCount: 88,
    badge: 'TRẢI NGHIỆM CAO CẤP',
    description: 'Mang đến trải nghiệm lưu trú cao cấp với không gian rộng rãi, riêng tư và được bài trí tinh tế. Là lựa chọn lý tưởng cho sự thoải mái, tiện nghi và mong muốn tận hưởng trọn vẹn từng khoảnh khắc trong kỳ nghỉ hay chuyến công tác.',
    images: [
      'https://nestahotel.com.vn/wp-content/uploads/2026/02/Executive-Double-1.webp',
      'https://nestahotel.com.vn/wp-content/uploads/2026/02/Executive-1.webp',
      'https://nestahotel.com.vn/wp-content/uploads/2026/02/905_12-1-1-1.webp'
    ],
    features: [
      'Tầng cao với tầm nhìn toàn cảnh Hà Nội',
      'Khu vực sofa tiếp khách riêng biệt',
      'Máy pha cà phê viên nén cao cấp',
      'Đặc quyền check-in sớm / check-out muộn',
      'Bồn tắm đá cẩm thạch thư giãn',
      'Ưu đãi 20% tại LumiStay Spa & Nhà hàng'
    ]
  },
  {
    _id: '6abd5984e2430b101fa736ff',
    id: 'room-suite',
    name: 'Phòng LumiStay Grand Suite',
    type: 'Suite',
    size: '60m2',
    bed: '1 giường đôi lớn King',
    view: 'Hướng thành phố panorama',
    maxGuests: 2,
    price: 2950000,
    priceFormatted: '2.950.000 VNĐ / đêm',
    rating: 5.0,
    reviewCount: 65,
    badge: '👑 HẠNG PHÒNG TỔNG THỐNG',
    description: 'Hạng phòng cao cấp nhất của LumiStay, nổi bật với không gian sang trọng và thiết kế tinh tế đương đại. Cửa sổ kính panorama thoáng đãng hướng ra phố mang đến tầm nhìn toàn cảnh, cảm nhận trọn vẹn sự thư thái, riêng tư và dịch vụ quản gia cao cấp.',
    images: [
      'https://nestahotel.com.vn/wp-content/uploads/2026/02/Suite-1.webp',
      'https://nestahotel.com.vn/wp-content/uploads/2026/02/905_3-1-1.webp',
      'https://nestahotel.com.vn/wp-content/uploads/2026/02/905_12-1-1-2.webp',
      'https://nestahotel.com.vn/wp-content/uploads/2026/02/905_6-1-1-1.webp'
    ],
    features: [
      'Phòng khách và phòng ngủ riêng biệt đẳng cấp',
      'Ban công panorama hướng phố cổ tuyệt đẹp',
      'Bồn sục Jacuzzi hiện đại trong phòng',
      'Rượu vang & giỏ trái cây chào đón',
      'Dịch vụ quản gia và xe đưa đón sân bay 1 chiều',
      'Phục vụ bữa sáng tận phòng theo yêu cầu'
    ]
  }
];

const NestaRoomsSection = ({ onBookRoom }) => {
  const [rooms, setRooms] = useState(DEFAULT_ROOMS);
  const [activeSlideMap, setActiveSlideMap] = useState({});
  const [modalRoom, setModalRoom] = useState(null);

  // Fetch real rooms from backend MongoDB API
  useEffect(() => {
    fetch('/api/rooms')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.rooms && data.rooms.length > 0) {
          // Merge with fallback data for consistent image carousels & badges
          const merged = data.rooms.map((apiRoom, i) => {
            const fallback = DEFAULT_ROOMS[i] || DEFAULT_ROOMS[0];
            return {
              ...fallback,
              ...apiRoom,
              _id: apiRoom._id || fallback._id,
              id: apiRoom._id || fallback.id,
              name: apiRoom.name || fallback.name,
              price: apiRoom.price || fallback.price,
              priceFormatted: `${(apiRoom.price || fallback.price).toLocaleString('vi-VN')} VNĐ / đêm`,
              size: apiRoom.area ? `${apiRoom.area}m2` : fallback.size,
              images: (apiRoom.images && apiRoom.images.length > 0) ? apiRoom.images : fallback.images,
              features: (apiRoom.amenities && apiRoom.amenities.length > 0) ? apiRoom.amenities : fallback.features,
              rating: apiRoom.rating || fallback.rating,
              reviewCount: apiRoom.reviewCount || fallback.reviewCount,
              badge: fallback.badge
            };
          });
          setRooms(merged);
        }
      })
      .catch(err => {
        console.log('Using default rooms:', err);
      });
  }, []);

  const handleNextSlide = (roomId, max) => {
    setActiveSlideMap(prev => ({
      ...prev,
      [roomId]: ((prev[roomId] || 0) + 1) % max
    }));
  };

  const handlePrevSlide = (roomId, max) => {
    setActiveSlideMap(prev => ({
      ...prev,
      [roomId]: ((prev[roomId] || 0) - 1 + max) % max
    }));
  };

  return (
    <section id="accommodation-type" className="accommodation-type">
      <div className="section-wrapper">
        <div className="section-header-modern text-center reveal-up">
          <span className="section-sub-gold">✦ BỘ SƯU TẬP PHÒNG NGHỈ THƯỢNG LƯU ✦</span>
          <h2 className="title heading-1 color-black">HẠNG PHÒNG LUMISTAY</h2>
          <p className="section-desc-light">
            Mỗi căn phòng là một kiệt tác thiết kế giao thoa giữa phong cách tối giản sang trọng và đầy đủ tiện nghi chuẩn 5 sao.
          </p>
        </div>

        <div className="accommodation-type__list">
          {rooms.map(room => {
            const currentIdx = activeSlideMap[room.id] || 0;
            const images = room.images || [];

            return (
              <div key={room.id} className="accommodation-item__horizontal">
                {/* Left: Image Slider with Badge */}
                <div className="slider-wrapper wrapper-slider-parallax reveal-up">
                  {room.badge && (
                    <div className="room-card-badge">
                      {room.badge}
                    </div>
                  )}

                  <div className="image-carousel">
                    {images.map((imgUrl, idx) => (
                      <div 
                        key={idx} 
                        className={`carousel-slide ${idx === currentIdx ? 'active' : ''}`}
                      >
                        <img 
                          src={imgUrl} 
                          alt={room.name}
                          loading="lazy" 
                        />
                      </div>
                    ))}
                  </div>

                  {images.length > 1 && (
                    <div className="swiper-arrows">
                      <button 
                        className="arrow-prev swiper-arrow" 
                        onClick={() => handlePrevSlide(room.id, images.length)}
                        aria-label="Previous"
                      >
                        <svg width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 5.5C4 4.5 7 1 7 0M1 5.5C4 6.5 7 10 7 11M1 5.5H14" stroke="currentColor" strokeLinejoin="bevel" />
                        </svg>
                      </button>
                      <button 
                        className="arrow-next swiper-arrow" 
                        onClick={() => handleNextSlide(room.id, images.length)}
                        aria-label="Next"
                      >
                        <svg width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13 5.5C10 4.5 7 1 7 0M13 5.5C10 6.5 7 10 7 11M13 5.5H0" stroke="currentColor" strokeLinejoin="bevel" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Right: Content Information */}
                <div className="content reveal-up reveal-delay-2">
                  <div>
                    <div className="content-meta-row">
                      <div className="rating-pill">
                        <span className="star">★</span> {room.rating} <span className="reviews-count">({room.reviewCount} đánh giá)</span>
                      </div>
                      <div className="room-price-block">
                        <span className="price-number">{room.priceFormatted}</span>
                      </div>
                    </div>

                    <h4 className="content-title heading-3 color-black">
                      {room.name}
                    </h4>

                    {/* Room Key Specs */}
                    <div className="content-info">
                      <div className="content-info__item body-1 color-gray-2">
                        <div className="icon">
                          <img src="https://nestahotel.com.vn/wp-content/themes/nesta/assets/images/icons/icon-expand.svg" alt="Size" />
                        </div>
                        <span>{room.size}</span>
                      </div>

                      <div className="content-info__item body-1 color-gray-2">
                        <div className="icon">
                          <img src="https://nestahotel.com.vn/wp-content/themes/nesta/assets/images/icons/icon-bed.svg" alt="Bed" />
                        </div>
                        <span>{room.bed}</span>
                      </div>

                      <div className="content-info__item body-1 color-gray-2">
                        <div className="icon">
                          <img src="https://nestahotel.com.vn/wp-content/themes/nesta/assets/images/icons/icon-photograph.svg" alt="View" />
                        </div>
                        <span>{room.view}</span>
                      </div>

                      <div className="content-info__item body-1 color-gray-2">
                        <div className="icon">
                          <img src="https://nestahotel.com.vn/wp-content/themes/nesta/assets/images/icons/icon-users.svg" alt="Capacity" />
                        </div>
                        <span>{room.maxGuests || 2} người</span>
                      </div>
                    </div>

                    <div className="content-desc body-1 color-black">
                      {room.description || room.desc}
                    </div>

                    {/* Value-added benefits */}
                    <div className="room-perks-pills">
                      <span className="perk-tag">✓ Miễn phí buffet sáng</span>
                      <span className="perk-tag">✓ Hủy phòng linh hoạt</span>
                      <span className="perk-tag">✓ Nhận phòng sớm</span>
                    </div>
                  </div>

                  <div className="btn-wrapper d-flex align-items-center justify-content-between mt-4">
                    <button 
                      className="button-global-gold" 
                      onClick={() => onBookRoom && onBookRoom(room)}
                    >
                      <span>ĐẶT PHÒNG NGAY</span>
                    </button>

                    <button 
                      className="btn-arrow text-uppercase color-black"
                      onClick={() => setModalRoom(room)}
                    >
                      <span>chi tiết phòng</span>
                      <div className="icon">
                        <svg width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13 5.5C10 4.5 7 1 7 0M13 5.5C10 6.5 7 10 7 11M13 5.5H0" stroke="#181819" strokeLinejoin="bevel" />
                        </svg>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Room Detail Modal */}
      {modalRoom && (
        <div className="nesta-modal-backdrop" onClick={() => setModalRoom(null)}>
          <div className="nesta-modal-content" onClick={e => e.stopPropagation()}>
            <button className="nesta-modal-close" onClick={() => setModalRoom(null)} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.3535 0.353516L0.353516 12.3535" stroke="#181819" strokeWidth="1.5" />
                <path d="M0.353516 0.353516L12.3535 12.3535" stroke="#181819" strokeWidth="1.5" />
              </svg>
            </button>

            <div className="nesta-modal-body">
              <div className="modal-gallery-strip">
                {(modalRoom.images || []).map((img, i) => (
                  <img key={i} src={img} alt="" className="modal-strip-img" />
                ))}
              </div>

              <div className="modal-room-info">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h3 className="modal-room-title">{modalRoom.name}</h3>
                  <div className="modal-room-price">{modalRoom.priceFormatted}</div>
                </div>
                
                <div className="modal-specs-grid">
                  <div><strong>Diện tích:</strong> {modalRoom.size}</div>
                  <div><strong>Giường:</strong> {modalRoom.bed}</div>
                  <div><strong>Tầm nhìn:</strong> {modalRoom.view}</div>
                  <div><strong>Sức chứa:</strong> {modalRoom.maxGuests || 2} người lớn</div>
                </div>

                <p className="modal-room-desc">{modalRoom.description || modalRoom.desc}</p>

                <h5 className="modal-amenities-heading">TIỆN NGHI PHÒNG NỔI BẬT:</h5>
                <ul className="modal-amenities-list">
                  {(modalRoom.features || []).map((f, i) => (
                    <li key={i}>✓ {typeof f === 'string' ? f : f.label || f.name}</li>
                  ))}
                </ul>

                <div className="modal-actions-bar">
                  <button 
                    className="button-global-gold w-100"
                    onClick={() => {
                      const r = modalRoom;
                      setModalRoom(null);
                      onBookRoom && onBookRoom(r);
                    }}
                  >
                    <span>TIẾN HÀNH ĐẶT PHÒNG NÀY</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default NestaRoomsSection;
