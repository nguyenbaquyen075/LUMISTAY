import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import './ServicesSection.css';

const services = [
  {
    id: 1,
    title: 'Nhà hàng & Bar',
    desc: 'Tinh hoa ẩm thực Á - Âu',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80'
  },
  {
    id: 2,
    title: 'Spa & Wellness',
    desc: 'Thư giãn, tái tạo năng lượng',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80'
  },
  {
    id: 3,
    title: 'Hồ bơi vô cực',
    desc: 'Tận hưởng đại dương xanh',
    image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80'
  },
  {
    id: 4,
    title: 'Gym & Fitness',
    desc: 'Giữ gìn sức khỏe mỗi ngày',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80'
  },
  {
    id: 5,
    title: 'Dịch vụ cao cấp',
    desc: 'Xe đưa đón, tour du lịch, concierge',
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&q=80'
  }
];

const ServicesSection = () => {
  return (
    <section id="dich-vu" className="services-section section-cream">
      <div className="section-inner-container">
        <div className="services-split-layout">
          {/* Left Column */}
          <div className="services-left-col">
            <span className="section-label">DỊCH VỤ TIỆN ÍCH</span>
            <h2 className="section-title">
              Trải nghiệm đẳng cấp <br />
              với hệ sinh thái dịch vụ 5 sao
            </h2>
            <p className="section-subtitle">
              Tại LumiStay, chúng tôi không chỉ mang đến một kỳ nghỉ, mà còn là hành trình của những trải nghiệm đáng nhớ.
            </p>
            <Link to="/contact" className="services-cta-btn">
              <span>Khám phá tất cả dịch vụ</span>
              <FiArrowRight />
            </Link>
          </div>

          {/* Right Column: 5 items row */}
          <div className="services-right-row">
            {services.map((item) => (
              <div key={item.id} className="service-compact-card">
                <img src={item.image} alt={item.title} className="service-img" />
                <div className="service-overlay"></div>
                <div className="service-content">
                  <h3 className="service-name">{item.title}</h3>
                  <div className="service-desc-row">
                    <span>{item.desc}</span>
                    <FiArrowRight className="service-arrow" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
