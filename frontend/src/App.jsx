import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import NestaHeader from './components/nesta/NestaHeader';
import NestaFooter from './components/nesta/NestaFooter';
import NestaCtaFloating from './components/nesta/NestaCtaFloating';
import Chatbot from './components/common/Chatbot';
import BookingModal from './components/booking/BookingModal';
import ScrollToTop from './components/common/ScrollToTop';

import Home from './pages/Home';
import RoomsPage from './pages/RoomsPage';
import RoomDetailPage from './pages/RoomDetailPage';
import BookingLookupPage from './pages/BookingLookupPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import MyBookingsPage from './pages/MyBookingsPage';
import useScrollReveal from './hooks/useScrollReveal';

function App() {
  // Global on-scroll bottom-to-top reveal animations
  useScrollReveal();

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const handleOpenBookingModal = () => {
    setSelectedRoomForBooking(null);
    setIsBookingModalOpen(true);
  };

  const handleBookSpecificRoom = (room) => {
    setSelectedRoomForBooking(room);
    setIsBookingModalOpen(true);
  };

  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <div className="app-layout">
          {/* Exact Nesta Header with Lang selector, brand logo, and navigation */}
          <NestaHeader 
            onOpenBookingModal={handleOpenBookingModal} 
          />

          <main className="main-content">
            <Routes>
              <Route 
                path="/" 
                element={
                  <Home 
                    onOpenBookingModal={handleOpenBookingModal} 
                    onBookRoom={handleBookSpecificRoom}
                    onOpenChatbot={() => setIsChatbotOpen(true)}
                  />
                } 
              />
              <Route 
                path="/rooms" 
                element={<RoomsPage onBookRoom={handleBookSpecificRoom} />} 
              />
              <Route 
                path="/rooms/:id" 
                element={<RoomDetailPage onBookRoom={handleBookSpecificRoom} />} 
              />
              <Route 
                path="/booking-lookup" 
                element={<BookingLookupPage />} 
              />
              <Route 
                path="/contact" 
                element={<ContactPage />} 
              />
              <Route 
                path="/login" 
                element={<LoginPage />} 
              />
              <Route 
                path="/register" 
                element={<RegisterPage />} 
              />
              <Route 
                path="/admin" 
                element={<AdminDashboard />} 
              />
              <Route 
                path="/my-bookings" 
                element={<MyBookingsPage />} 
              />
            </Routes>
          </main>

          {/* Exact Nesta Footer */}
          <NestaFooter />

          {/* Floating CTA & Booking button with AI Concierge */}
          <NestaCtaFloating 
            onOpenBookingModal={handleOpenBookingModal} 
            onOpenChatbot={() => setIsChatbotOpen(true)}
          />

          {/* Floating AI Chatbot Widget */}
          <Chatbot 
            isOpen={isChatbotOpen} 
            onClose={() => setIsChatbotOpen(false)} 
          />

          {/* Global Booking Modal hooked to real backend API */}
          <BookingModal 
            isOpen={isBookingModalOpen} 
            onClose={() => setIsBookingModalOpen(false)} 
            selectedRoom={selectedRoomForBooking}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
