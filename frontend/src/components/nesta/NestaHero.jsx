import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiChevronDown, FiPlus, FiMinus } from 'react-icons/fi';
import './NestaHero.css';

const destinations = [
  'LumiStay Hanoi Luxury Hotel',
  'LumiStay Saigon Central',
  'LumiStay Danang Beach Resort',
  'LumiStay Dalat Pine Valley',
  'LumiStay Hoian Heritage Resort'
];

const NestaHero = ({ onOpenBookingModal }) => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [destination, setDestination] = useState('LumiStay Hanoi Luxury Hotel');
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);

  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [showPeopleDropdown, setShowPeopleDropdown] = useState(false);

  const [promoCode, setPromoCode] = useState('');

  // Scroll-driven entrance: the exterior shot splits into two doors that
  // swing open (while zooming in) to reveal the interior.
  const exteriorImg = 'https://nestahotel.com.vn/wp-content/uploads/2026/02/Overview_1-1-1.webp';
  const interiorImg = 'https://nestahotel.com.vn/wp-content/uploads/2026/02/LAM9643-1.jpg';

  const trackRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] });
  const leftX = useTransform(scrollYProgress, [0.1, 0.7], ['0%', '-100%']);
  const rightX = useTransform(scrollYProgress, [0.1, 0.7], ['0%', '100%']);
  const doorScale = useTransform(scrollYProgress, [0, 0.7], [1, 1.35]);
  const interiorScale = useTransform(scrollYProgress, [0.1, 1], [1.3, 1]);
  const captionOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const captionY = useTransform(scrollYProgress, [0, 0.25], [0, -60]);

  const destRef = useRef(null);
  const peopleRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (destRef.current && !destRef.current.contains(e.target)) {
        setShowDestDropdown(false);
      }
      if (peopleRef.current && !peopleRef.current.contains(e.target)) {
        setShowPeopleDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (onOpenBookingModal) {
      onOpenBookingModal();
    }
  };

  return (
    <div className="hero-track" ref={trackRef}>
    <section className="hero">
      <div className="container-fluid p-0">
        <div className="hero-option-slider">
          <motion.img src={interiorImg} alt="LumiStay lobby" className="hero-interior" style={{ scale: interiorScale }} />
          <motion.div className="hero-door hero-door-left" style={{ x: leftX }}>
            <motion.img src={exteriorImg} alt="LumiStay Hanoi" style={{ scale: doorScale, transformOrigin: 'right center' }} />
          </motion.div>
          <motion.div className="hero-door hero-door-right" style={{ x: rightX }}>
            <motion.img src={exteriorImg} alt="" style={{ scale: doorScale, transformOrigin: 'left center' }} />
          </motion.div>
        </div>

        {/* Luxury Hero Caption */}
        <motion.div className="hero-luxury-caption" style={{ opacity: captionOpacity, y: captionY }}>
          <div className="hero-luxury-badge">
            <span>✦</span> 5-STAR LUXURY HOTEL &amp; RESIDENCES <span>✦</span>
          </div>
          <h1 className="hero-luxury-title">LUMISTAY HANOI</h1>
          <p className="hero-luxury-subtitle">
            Khởi nguồn không gian lưu trú thanh lịch &amp; đẳng cấp vượt thời gian
          </p>
        </motion.div>

        {/* NESTA FORM: #bookingHotel */}
        <div className="booking-hotel-container">
          <form action="" id="bookingHotel" onSubmit={handleSearch}>
            {/* 1. DESTINATION */}
            <div className="booking-form-item" ref={destRef}>
              <div 
                className="dropdown-custom-select select-destination selected"
                onClick={() => {
                  setShowDestDropdown(!showDestDropdown);
                  setShowPeopleDropdown(false);
                }}
              >
                <div className="dropdown-custom-btn d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center dropdown-custom-label gap-2">
                    <div className="icon flex-shrink-0">
                      <img
                        src="https://nestahotel.com.vn/wp-content/themes/nesta/assets/images/icons/icon-destination.svg"
                        alt=""
                      />
                    </div>
                    <div className="dropdown-custom-text">
                      {destination}
                    </div>
                  </div>
                  <div className="icon-arrow">
                    <img
                      src="https://nestahotel.com.vn/wp-content/themes/nesta/assets/images/icons/icon-arrow-down.svg"
                      alt=""
                    />
                  </div>
                </div>

                {showDestDropdown && (
                  <div className="dropdown-custom-menu show">
                    {destinations.map((d, i) => (
                      <div
                        key={i}
                        className={`dropdown-custom-item ${d === destination ? 'is-active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDestination(d);
                          setShowDestDropdown(false);
                        }}
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 2. DATE */}
            <div className="booking-form-item">
              <div className="booking-calendar d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2 w-100">
                  <div className="icon flex-shrink-0">
                    <img
                      src="https://nestahotel.com.vn/wp-content/themes/nesta/assets/images/icons/icon-calendar.svg"
                      alt=""
                    />
                  </div>
                  <div className="booking-time d-flex align-items-center">
                    <input 
                      type="date" 
                      value={checkIn}
                      min={today}
                      onChange={e => setCheckIn(e.target.value)}
                      id="checkInDate" 
                    />
                    <span>-</span>
                    <input 
                      type="date" 
                      value={checkOut}
                      min={checkIn || today}
                      onChange={e => setCheckOut(e.target.value)}
                      id="checkOutDate" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. PEOPLE */}
            <div className="booking-form-item" ref={peopleRef}>
              <div className="select-people">
                <div 
                  className="select-people-wrapper d-flex align-items-center gap-2"
                  onClick={() => {
                    setShowPeopleDropdown(!showPeopleDropdown);
                    setShowDestDropdown(false);
                  }}
                >
                  <div className="icon flex-shrink-0">
                    <img
                      src="https://nestahotel.com.vn/wp-content/themes/nesta/assets/images/icons/icon-people.svg"
                      alt=""
                    />
                  </div>
                  <div className="label">
                    <span className="adult-value">{adults}</span> Người lớn,{' '}
                    <span className="child-value">{children}</span> Trẻ em
                  </div>
                </div>

                {showPeopleDropdown && (
                  <div className="select-box show">
                    <div className="adult d-flex align-items-center justify-content-between">
                      <div className="label">Người lớn</div>
                      <div className="select d-flex align-items-center">
                        <div 
                          className="min" 
                          onClick={() => setAdults(prev => Math.max(1, prev - 1))}
                        >
                          -
                        </div>
                        <div className="val">{adults}</div>
                        <div 
                          className="plus" 
                          onClick={() => setAdults(prev => prev + 1)}
                        >
                          +
                        </div>
                      </div>
                    </div>

                    <div className="child d-flex align-items-center justify-content-between mt-2">
                      <div className="label">Trẻ em</div>
                      <div className="select d-flex align-items-center">
                        <div 
                          className="min" 
                          onClick={() => setChildren(prev => Math.max(0, prev - 1))}
                        >
                          -
                        </div>
                        <div className="val">{children}</div>
                        <div 
                          className="plus" 
                          onClick={() => setChildren(prev => prev + 1)}
                        >
                          +
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. PROMO */}
            <div className="booking-form-item">
              <div className="booking-promotion d-flex align-items-center gap-2">
                <div className="icon flex-shrink-0">
                  <img
                    src="https://nestahotel.com.vn/wp-content/themes/nesta/assets/images/icons/icon-promotion.svg"
                    alt=""
                  />
                </div>
                <input
                  type="text"
                  name="promo_code"
                  placeholder="Mã khuyến mãi"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
              </div>
            </div>

            {/* 5. SUBMIT */}
            <div className="booking-form-item button-find-room d-flex justify-content-end">
              <button className="button-global" type="submit">
                <span>tìm phòng</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
    </div>
  );
};

export default NestaHero;
