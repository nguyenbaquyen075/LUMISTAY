import React, { useState } from 'react';
import './NestaCtaFloating.css';

const NestaCtaFloating = ({ onOpenBookingModal, onOpenChatbot }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div id="cta" className="nesta-cta-container">
      {/* Contact Channels */}
      <div className={`cta-wrapper ${isOpen ? 'open' : ''}`}>
        <button 
          className="cta-global" 
          onClick={() => setIsOpen(!isOpen)} 
          aria-label="Toggle contact menu"
        >
          {isOpen ? (
            <img 
              src="https://nestahotel.com.vn/wp-content/themes/nesta/assets/images/icons/icon-close-white.svg" 
              alt="Close" 
            />
          ) : (
            <img 
              src="https://nestahotel.com.vn/wp-content/themes/nesta/assets/images/icons/icon-chat.svg" 
              alt="Chat" 
            />
          )}
        </button>

        <div className={`cta-list ${isOpen ? 'active' : ''}`}>
          <div className="cta-item item-call" title="Gọi hotline">
            <a href="tel:+842439418888" target="_blank" rel="noopener noreferrer">
              <img src="https://nestahotel.com.vn/wp-content/themes/nesta/assets/images/icons/icon-call.svg" alt="Phone" />
            </a>
          </div>

          <div className="cta-item item-zalo" title="Chat Zalo">
            <a href="https://zalo.me/0982822216" target="_blank" rel="noopener noreferrer">
              <img src="https://nestahotel.com.vn/wp-content/themes/nesta/assets/images/icons/icon-zalo.svg" alt="Zalo" />
            </a>
          </div>

          <div className="cta-item item-messenger" title="Facebook Messenger">
            <a href="https://www.facebook.com/nestahotelhanoi.nth" target="_blank" rel="noopener noreferrer">
              <img src="https://nestahotel.com.vn/wp-content/themes/nesta/assets/images/icons/icon-messenger.svg" alt="Messenger" />
            </a>
          </div>

          {onOpenChatbot && (
            <div 
              className="cta-item item-ai" 
              title="Trợ lý ảo LumiStay AI Concierge"
              onClick={() => {
                onOpenChatbot();
                setIsOpen(false);
              }}
              style={{ cursor: 'pointer' }}
            >
              <span style={{ fontSize: '20px', color: '#caa66d', fontWeight: 'bold' }}>✧</span>
            </div>
          )}
        </div>
      </div>

      {/* Floating Booking Button */}
      <button 
        className="cta-booking" 
        onClick={onOpenBookingModal}
        title="Đặt phòng ngay"
      >
        <img 
          src="https://nestahotel.com.vn/wp-content/themes/nesta/assets/images/icons/icon-calendar-white.svg" 
          alt="Book" 
        />
        <span>Đặt phòng</span>
      </button>
    </div>
  );
};

export default NestaCtaFloating;
