import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiSearch, FiMenu, FiX } from 'react-icons/fi';
import './Navbar.css';

const Navbar = ({ onOpenBookingModal }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = location.pathname === '/';

  return (
    <header className={`navbar-header ${scrolled || !isHome ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-brand">
          <div className="brand-logo-mark">
            <span className="brand-icon">✧</span>
            <div className="brand-text">
              <span className="brand-title">LumiStay</span>
              <span className="brand-subtitle">More than a stay</span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="navbar-nav">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            TRANG CHỦ
          </Link>
          <a href="/#gioi-thieu" className="nav-link">
            GIỚI THIỆU
          </a>
          <Link to="/rooms" className={`nav-link ${location.pathname === '/rooms' ? 'active' : ''}`}>
            PHÒNG & GIÁ
          </Link>
          <Link to="/booking-lookup" className={`nav-link ${location.pathname === '/booking-lookup' ? 'active' : ''}`}>
            TRA CỨU ĐẶT PHÒNG
          </Link>
          <Link to="/contact" className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`}>
            LIÊN HỆ
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="navbar-actions">
          <button className="nav-icon-btn" title="Tìm kiếm" onClick={() => navigate('/rooms')}>
            <FiSearch />
          </button>

          <div className="nav-lang">
            <span className="flag-icon">🇻🇳</span>
            <span className="lang-text">VN</span>
          </div>

          <button 
            className="btn btn-primary btn-sm btn-nav-book"
            onClick={onOpenBookingModal}
          >
            ĐẶT PHÒNG
          </button>

          {/* Mobile hamburger */}
          <button 
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>TRANG CHỦ</Link>
          <a href="/#gioi-thieu" onClick={() => setMobileMenuOpen(false)}>GIỚI THIỆU</a>
          <Link to="/rooms" onClick={() => setMobileMenuOpen(false)}>PHÒNG & GIÁ</Link>
          <Link to="/booking-lookup" onClick={() => setMobileMenuOpen(false)}>TRA CỨU ĐẶT PHÒNG</Link>
          <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>LIÊN HỆ</Link>
          <div className="mobile-drawer-footer">
            <button 
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBookingModal();
              }}
            >
              ĐẶT PHÒNG NGAY
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
