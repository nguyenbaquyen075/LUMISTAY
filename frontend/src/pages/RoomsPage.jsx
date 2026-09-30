import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiSearch, FiFilter, FiMaximize2, FiUser, FiDisc, FiCheck, FiArrowRight } from 'react-icons/fi';
import api from '../utils/api';
import { formatPrice } from '../utils/helpers';
import './RoomsPage.css';

const roomTypes = ['Tất cả', 'Deluxe', 'Premier Suite', 'Family Room', 'Villa'];

const RoomsPage = ({ onBookRoom }) => {
  const [searchParams] = useSearchParams();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || 'Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState(10000000);

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      try {
        const res = await api.get('/rooms');
        if (res.data.rooms) {
          setRooms(res.data.rooms);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const filteredRooms = rooms.filter(room => {
    const matchesType = selectedType === 'Tất cả' || room.type.toLowerCase().includes(selectedType.toLowerCase());
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          room.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = room.price <= maxPrice;
    return matchesType && matchesSearch && matchesPrice;
  });

  return (
    <div className="rooms-page">
      {/* Banner */}
      <div className="page-header-banner">
        <div className="banner-overlay"></div>
        <div className="container banner-content">
          <span className="section-label">LUMISTAY RESORT</span>
          <h1 className="banner-title">Phòng & Biệt Thự Nghỉ Dưỡng</h1>
          <p className="banner-sub">
            Khám phá bộ sưu tập không gian sống tinh tế, được thiết kế để mang đến sự thư thái tuyệt đối và tầm nhìn biển ngoạn mục.
          </p>
        </div>
      </div>

      <div className="container rooms-page-container">
        {/* Filter Bar */}
        <div className="rooms-filter-card">
          <div className="filter-search-box">
            <FiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên phòng, tiện nghi..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-type-pills">
            {roomTypes.map(t => (
              <button 
                key={t}
                className={`type-pill-btn ${selectedType === t ? 'active' : ''}`}
                onClick={() => setSelectedType(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="filter-price-slider">
            <div className="price-label-row">
              <span>Giá tối đa:</span>
              <strong>{formatPrice(maxPrice)}/đêm</strong>
            </div>
            <input 
              type="range" 
              min="1000000" 
              max="10000000" 
              step="500000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Rooms Grid */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Đang tải danh sách phòng...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="no-rooms-card">
            <h3>Không tìm thấy phòng phù hợp</h3>
            <p>Vui lòng thử thay đổi tiêu chí lọc hoặc tìm kiếm lại.</p>
            <button className="btn btn-secondary" onClick={() => { setSelectedType('Tất cả'); setSearchQuery(''); setMaxPrice(10000000); }}>
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <div className="rooms-catalog-grid">
            {filteredRooms.map(room => (
              <div key={room._id} className="room-catalog-card">
                <div className="catalog-img-wrap">
                  <img src={room.images?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80'} alt={room.name} />
                  <span className="room-badge-type">{room.type}</span>
                  {room.rating > 0 && (
                    <div className="room-rating-pill">
                      ★ {room.rating} ({room.reviewCount})
                    </div>
                  )}
                </div>

                <div className="catalog-body">
                  <h3 className="catalog-name">
                    <Link to={`/rooms/${room._id}`}>{room.name}</Link>
                  </h3>
                  <p className="catalog-desc">{room.shortDescription || room.description?.substring(0, 90) + '...'}</p>

                  <div className="catalog-meta-row">
                    <span><FiMaximize2 /> {room.area} m²</span>
                    <span><FiUser /> Tối đa {room.maxGuests} khách</span>
                    <span><FiDisc /> {room.bedrooms} phòng ngủ</span>
                  </div>

                  {room.amenities && (
                    <div className="catalog-amenities-tags">
                      {room.amenities.slice(0, 4).map((a, i) => (
                        <span key={i} className="amenity-tag"><FiCheck /> {a}</span>
                      ))}
                    </div>
                  )}

                  <div className="catalog-footer">
                    <div className="price-tag-wrap">
                      <span className="price-num">{formatPrice(room.price)}</span>
                      <span className="price-sub">/ đêm</span>
                    </div>

                    <div className="catalog-actions">
                      <Link to={`/rooms/${room._id}`} className="btn btn-secondary btn-sm">
                        Chi tiết
                      </Link>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => onBookRoom && onBookRoom(room)}
                      >
                        Đặt ngay
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomsPage;
