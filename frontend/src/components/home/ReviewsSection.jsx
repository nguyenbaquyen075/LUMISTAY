import React, { useState } from 'react';
import { FiArrowRight, FiChevronLeft, FiChevronRight, FiStar } from 'react-icons/fi';
import './ReviewsSection.css';

const reviewsData = [
  {
    id: 1,
    name: 'Nguyễn Thị Mai',
    title: 'Khách hàng thân thiết',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
    comment: 'Không gian tuyệt vời, dịch vụ chuyên nghiệp, đặc biệt là bữa sáng rất ngon. Tôi chắc chắn sẽ quay lại!',
    rating: 5
  },
  {
    id: 2,
    name: 'Trần Văn Hùng',
    title: 'Doanh nhân',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    comment: 'LumiStay mang đến trải nghiệm nghỉ dưỡng đẳng cấp vượt mong đợi. Phòng ốc hiện đại, view biển cực đẹp!',
    rating: 5
  },
  {
    id: 3,
    name: 'Lê Thị Trang',
    title: 'Du khách',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80',
    comment: 'Tôi rất ấn tượng với sự tận tâm của nhân viên và các tiện ích tại đây. Một kỳ nghỉ thật đáng nhớ!',
    rating: 5
  }
];

const ReviewsSection = () => {
  const [index, setIndex] = useState(0);

  const next = () => setIndex((prev) => (prev + 1) % reviewsData.length);
  const prev = () => setIndex((prev) => (prev - 1 + reviewsData.length) % reviewsData.length);

  return (
    <section className="reviews-section section-dark">
      <div className="section-inner-container">
        <div className="reviews-split-layout">
          {/* Left Column */}
          <div className="reviews-left-col">
            <span className="section-label">ĐÁNH GIÁ KHÁCH HÀNG</span>
            <h2 className="section-title">
              Trải nghiệm thực tế <br />
              từ những vị khách đặc biệt
            </h2>
            <p className="section-subtitle light">
              Sự hài lòng của bạn là động lực để LumiStay ngày càng hoàn thiện hơn.
            </p>
            <a href="#reviews-all" className="reviews-cta-btn">
              <span>Xem thêm đánh giá</span>
              <FiArrowRight />
            </a>
          </div>

          {/* Right Area: 3 review cards + 1 calligraphy card */}
          <div className="reviews-right-grid">
            {reviewsData.map((item) => (
              <div key={item.id} className="review-compact-card">
                <div className="review-author-row">
                  <img src={item.avatar} alt={item.name} className="review-avatar" />
                  <div>
                    <h4 className="author-name">{item.name}</h4>
                    <span className="author-role">{item.title}</span>
                  </div>
                </div>

                <p className="review-quote">"{item.comment}"</p>

                <div className="review-stars">
                  {[...Array(item.rating)].map((_, i) => (
                    <FiStar key={i} className="star-icon" />
                  ))}
                </div>
              </div>
            ))}

            {/* Calligraphy Sunset Card */}
            <div className="reviews-calligraphy-card">
              <div className="calligraphy-overlay"></div>
              <div className="calligraphy-inner">
                <h3 className="calligraphy-heading">
                  Khách hàng <br />
                  <em>nói gì về chúng tôi?</em>
                </h3>
                <div className="calligraphy-arrows">
                  <button onClick={prev} className="mini-arrow-btn"><FiChevronLeft /></button>
                  <button onClick={next} className="mini-arrow-btn"><FiChevronRight /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;
