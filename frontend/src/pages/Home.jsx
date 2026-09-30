import React from 'react';
import NestaHero from '../components/nesta/NestaHero';
import NestaAccommodationDetail from '../components/nesta/NestaAccommodationDetail';
import NestaRoomsSection from '../components/nesta/NestaRoomsSection';
import NestaOffersSection from '../components/nesta/NestaOffersSection';
import NestaSliderGallery from '../components/nesta/NestaSliderGallery';
import NestaGallerySection from '../components/nesta/NestaGallerySection';
import LumiStayReviewsSection from '../components/nesta/LumiStayReviewsSection';
import NestaLocationSection from '../components/nesta/NestaLocationSection';
import useScrollReveal from '../hooks/useScrollReveal';

const Home = ({ onOpenBookingModal, onBookRoom, onOpenChatbot }) => {
  // Activate on-scroll bottom-to-top reveal animations across all sections
  useScrollReveal();

  return (
    <div className="nesta-home-page">
      {/* 1. Hero with #bookingHotel bar */}
      <NestaHero
        onOpenBookingModal={onOpenBookingModal}
        onOpenChatbot={onOpenChatbot}
      />

      {/* 2. Overview & General Facilities */}
      <NestaAccommodationDetail />

      {/* 3. Room Types (Horizontal Cards from real MongoDB) */}
      <NestaRoomsSection onBookRoom={onBookRoom} />

      {/* 4. Featured Offers */}
      <NestaOffersSection onOpenBookingModal={onOpenBookingModal} />

      {/* 5. Highlight Services (La Palace & Spa) */}
      <NestaSliderGallery />

      {/* 6. Photo Gallery */}
      <NestaGallerySection />

      {/* 7. Real Guest Reviews & Ratings */}
      <LumiStayReviewsSection />

      {/* 8. Destination Location & Landmarks */}
      <NestaLocationSection />
    </div>
  );
};

export default Home;
