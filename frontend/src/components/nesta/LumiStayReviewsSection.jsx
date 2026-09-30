import React, { useState, useEffect } from 'react';
import './LumiStayReviewsSection.css';

const DEFAULT_REVIEWS = [
  {
    _id: '1',
    guestName: 'Nguyễn Thu Mai',
    guestTitle: 'Doanh nhân • Hà Nội',
    guestAvatar: 'https://i.pravatar.cc/150?img=1',
    rating: 5,
    title: 'Kỳ nghỉ hoàn hảo & dịch vụ tận tâm',
    content: 'LumiStay đã mang lại cho tôi một trải nghiệm nghỉ dưỡng thực sự đáng nhớ. Phòng Executive nhìn thẳng ra phố rất yên tĩnh, giường êm ái cùng hệ thống cách âm tuyệt vời. Đội ngũ nhân viên luôn mỉm cười và hỗ trợ chu đáo từng chi tiết nhỏ.'
  },
  {
    _id: '2',
    guestName: 'Michael Chen',
    guestTitle: 'Business Traveler • Singapore',
    guestAvatar: 'https://i.pravatar.cc/150?img=7',
    rating: 5,
    title: 'Top-tier luxury experience in Hanoi',
    content: 'One of the best boutique hotels in Hanoi. The Grand Suite was immaculate with breathtaking panoramic views. The La Palace restaurant breakfast buffet is exceptional. High-speed internet and quiet workspace made my business trip effortless.'
  },
  {
    _id: '3',
    guestName: 'Trần Văn Hùng',
    guestTitle: 'Du khách • TP. Hồ Chí Minh',
    guestAvatar: 'https://i.pravatar.cc/150?img=3',
    rating: 5,
    title: 'Không gian sang trọng, vị trí đắc địa',
    content: 'Vị trí khách sạn rất tiện để di chuyển đến các địa danh nổi tiếng như Văn Miếu, Nhà tù Hỏa Lò, hồ Thiền Quang. Thiết kế vừa hiện đại vừa ấm cúng, đặc biệt là dịch vụ Spa phục hồi năng lượng rất tuyệt vời sau ngày dài công tác.'
  }
];

const LumiStayReviewsSection = () => {
  const [reviews, setReviews] = useState(DEFAULT_REVIEWS);

  useEffect(() => {
    fetch('/api/reviews')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.reviews && data.reviews.length > 0) {
          setReviews(data.reviews.slice(0, 3));
        }
      })
      .catch(() => {
        // Fallback gracefully to default reviews
      });
  }, []);

  return (
    <section className="lumistay-reviews-section">
      <div className="section-wrapper">
        <div className="text-center section-header-reviews reveal-up">
          <span className="section-sub-gold">✦ ĐÁNH GIÁ TỪ KHÁCH HÀNG ✦</span>
          <h2 className="title heading-1 color-black">TRẢI NGHIỆM THỰC TẾ TẠI LUMISTAY</h2>
          <div className="reviews-summary-bar">
            <span className="rating-score">★ 4.9 / 5.0</span>
            <span className="dot-sep">•</span>
            <span className="rating-desc">Hơn 450+ đánh giá xuất sắc từ du khách quốc tế &amp; trong nước</span>
          </div>
        </div>

        <div className="reviews-grid">
          {reviews.map(review => (
            <div key={review._id} className="review-card-modern reveal-up">
              <div className="review-stars">
                {[...Array(review.rating || 5)].map((_, i) => (
                  <span key={i} className="star-icon">★</span>
                ))}
              </div>

              <h4 className="review-title">"{review.title}"</h4>
              <p className="review-content">{review.content}</p>

              <div className="reviewer-info reveal-up reveal-delay-3">
                <img 
                  src={review.guestAvatar || 'https://i.pravatar.cc/150?img=12'} 
                  alt={review.guestName} 
                  className="reviewer-avatar" 
                />
                <div className="reviewer-meta">
                  <div className="reviewer-name">{review.guestName}</div>
                  <div className="reviewer-title">{review.guestTitle || review.guestNationality || 'Du khách'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LumiStayReviewsSection;
