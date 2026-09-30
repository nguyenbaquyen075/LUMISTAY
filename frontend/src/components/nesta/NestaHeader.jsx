import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiChevronDown } from 'react-icons/fi';
import './NestaHeader.css';

const NestaHeader = ({ onOpenBookingModal }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('VIE');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const languages = [
    { code: 'VIE', label: 'Tiếng Việt', flag: 'https://nestahotel.com.vn/wp-content/themes/nesta/assets/images/flag/flag-vi.svg' },
    { code: 'ENG', label: 'English', flag: 'https://nestahotel.com.vn/wp-content/themes/nesta/assets/images/flag/flag-en.svg' },
    { code: 'KOR', label: '한국어', flag: 'https://nestahotel.com.vn/wp-content/themes/nesta/assets/images/flag/flag-ko.svg' },
    { code: 'ZHO', label: '中文', flag: 'https://nestahotel.com.vn/wp-content/themes/nesta/assets/images/flag/flag-zh.svg' }
  ];

  return (
    <header id="header" className={`header-nesta ${scrolled ? 'header-scrolled' : ''}`}>
      <div className="header-container-inner">
        {/* Left: Language Dropdown */}
        <div className="header-lang-wrapper">
          <div className="dropdown-lang" onClick={() => setLangOpen(!langOpen)}>
            <div className="lang-current">
              <span>{currentLang}</span>
              <img 
                src={languages.find(l => l.code === currentLang)?.flag || languages[0].flag} 
                alt={currentLang} 
                className="flag-img"
              />
              <FiChevronDown className="arrow-icon" />
            </div>

            {langOpen && (
              <div className="lang-menu">
                {languages.map(l => (
                  <div 
                    key={l.code} 
                    className={`lang-item ${l.code === currentLang ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentLang(l.code);
                      setLangOpen(false);
                    }}
                  >
                    <img src={l.flag} alt={l.label} />
                    <span>{l.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: LumiStay Luxury Logo */}
        <div className="header-logo-center">
          <Link to="/" className="nesta-brand">
            <span className="brand-emblem">✧</span>
            <span className="nesta-brand-logo-text">LUMISTAY</span>
            <span className="nesta-brand-sub-text">HANOI LUXURY HOTEL</span>
          </Link>
        </div>

        {/* Right: Navigation Menu & Booking Button */}
        <div className="header-right-action">
          <nav className="header-main-nav">
            <a href="#accommodation-detail" className="nesta-nav-link">GIỚI THIỆU</a>
            <a href="#accommodation-type" className="nesta-nav-link active">HẠNG PHÒNG</a>
            <a href="#featured-offers" className="nesta-nav-link">ƯU ĐÃI</a>
            <a href="#section-gallery" className="nesta-nav-link">THƯ VIỆN</a>
            <a href="#destination-location" className="nesta-nav-link">VỊ TRÍ</a>
            <Link to="/booking-lookup" className="nesta-nav-link">TRA CỨU</Link>
          </nav>

          <button className="button-global-book" onClick={onOpenBookingModal}>
            <span>ĐẶT PHÒNG</span>
          </button>

          {/* Mobile hamburger */}
          <button 
            className="mobile-btn-toggle" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <a href="#accommodation-detail" onClick={() => setMobileMenuOpen(false)}>GIỚI THIỆU</a>
          <a href="#accommodation-type" onClick={() => setMobileMenuOpen(false)}>HẠNG PHÒNG</a>
          <a href="#featured-offers" onClick={() => setMobileMenuOpen(false)}>ƯU ĐÃI NỔI BẬT</a>
          <a href="#section-gallery" onClick={() => setMobileMenuOpen(false)}>THƯ VIỆN ẢNH</a>
          <a href="#destination-location" onClick={() => setMobileMenuOpen(false)}>VỊ TRÍ ĐIỂM ĐẾN</a>
          <Link to="/booking-lookup" onClick={() => setMobileMenuOpen(false)}>TRA CỨU ĐẶT PHÒNG</Link>
          <button 
            className="button-global-book w-100" 
            style={{ marginTop: '16px' }}
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenBookingModal();
            }}
          >
            <span>ĐẶT PHÒNG NGAY</span>
          </button>
        </div>
      )}
    </header>
  );
};

export default NestaHeader;
