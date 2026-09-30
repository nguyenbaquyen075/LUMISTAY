import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiChevronLeft, FiChevronRight, FiMaximize2, FiUser, FiDisc } from 'react-icons/fi';
import api from '../../utils/api';
import { formatPrice } from '../../utils/helpers';
import './FeaturedRooms.css';

const defaultRooms = [
  {
    _id: '1',
    name: 'Deluxe Ocean View',
    type: 'Deluxe',
    area: 45,
    maxGuests: 2,
    bedrooms: 1,
    bedType: '1 giường lớn',
    price: 2000000,
    images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80']
  },
  {
    _id: '2',
    name: 'Premier Suite',
    type: 'Premier Suite',
    area: 65,
    maxGuests: 3,
    bedrooms: 1,
    bedType: '1 giường lớn',
    price: 3500000,
    images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80']
  },
  {
    _id: '3',
    name: 'Family Room',
    type: 'Family Room',
    area: 60,
    maxGuests: 4,
    bedrooms: 2,
    bedType: '2 giường lớn',
    price: 4500000,
    images: ['https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&q=80']
  },
  {
    _id: '4',
    name: 'Villa View Biển',
    type: 'Villa',
    area: 120,
    maxGuests: 6,
    bedrooms: 2,
    bedType: '2 giường lớn',
    price: 8000000,
    images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80']
  }
];

const FeaturedRooms = ({ onBookRoom }) => {
  const [rooms, setRooms] = useState(defaultRooms);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get('/rooms?featured=true');
        if (res.data?.rooms?.length > 0) {
          setRooms(res.data.rooms);
        }
      } catch (err) {}
    };
    fetchRooms();
  }, []);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="featured-rooms-section section-dark">
      <div className="section-inner-container">
        <div className="rooms-split-layout">
          {/* Left Column: Heading + Text + Link + Left arrow */}
          <div className="rooms-left-col">
            <span className="section-label">PHÒNG NGHỈ</span>
            <h2 className="section-title">
              Sang trọng trong từng <br />
              không gian
            </h2>
            <p className="section-subtitle light">
              Từ phòng Deluxe ấm cúng đến Villa hướng biển riêng tư, mỗi không gian tại LumiStay đều được thiết kế tinh tế, mang đến trải nghiệm nghỉ dưỡng hoàn hảo nhất.
            </p>
            <div className="rooms-cta-row">
              <Link to="/rooms" className="rooms-view-all-link">
                <span>Xem tất cả phòng</span>
                <FiArrowRight />
              </Link>
              <button className="carousel-nav-btn prev-btn" onClick={() => scroll('left')} title="Trước">
                <FiChevronLeft />
              </button>
            </div>
          </div>

          {/* Right Area: Carousel cards + Right arrow */}
          <div className="rooms-right-wrapper">
            <div className="rooms-carousel-track" ref={scrollContainerRef}>
              {rooms.map((room) => (
                <div key={room._id} className="room-card-compact">
                  <div className="room-card-thumb">
                    <img 
                      src={room.images?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80'} 
                      alt={room.name} 
                    />
                  </div>

                  <div className="room-card-info">
                    <h3 className="room-card-title">
                      <Link to={`/rooms/${room._id}`}>{room.name}</Link>
                    </h3>

                    <div className="room-card-specs">
                      <span><FiMaximize2 /> {room.area} m²</span>
                      <span className="pipe">|</span>
                      <span><FiDisc /> {room.bedType || `${room.bedrooms || 1} giường lớn`}</span>
                      <span className="pipe">|</span>
                      <span><FiUser /> {room.maxGuests} khách</span>
                    </div>

                    <div className="room-card-bottom">
                      <div className="price-display">
                        <span className="price-val">{formatPrice(room.price)}</span>
                        <span className="price-unit">/đêm</span>
                      </div>
                      <button 
                        className="btn-book-pill"
                        onClick={() => onBookRoom && onBookRoom(room)}
                      >
                        Đặt ngay
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="carousel-nav-btn next-btn" onClick={() => scroll('right')} title="Sau">
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedRooms;
