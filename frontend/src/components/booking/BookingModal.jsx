import React, { useState, useEffect } from 'react';
import { FiX, FiCheckCircle, FiCalendar, FiUser, FiMail, FiPhone, FiDollarSign } from 'react-icons/fi';
import api from '../../utils/api';
import { formatPrice, calculateNights } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import './BookingModal.css';

const BookingModal = ({ isOpen, onClose, selectedRoom }) => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('transfer');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    nationality: 'Việt Nam',
    note: ''
  });
  const [loading, setLoading] = useState(false);
  const [successBooking, setSuccessBooking] = useState(null);
  const [error, setError] = useState('');
  const [quote, setQuote] = useState(null); // server price for the chosen room type and stay

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get('/rooms');
        if (res.data.rooms) {
          setRooms(res.data.rooms);
          if (!selectedRoom && res.data.rooms.length > 0) {
            setRoomId(res.data.rooms[0]._id);
          }
        }
      } catch (err) {}
    };
    fetchRooms();

    // Default dates: tomorrow & 2 days later
    const d1 = new Date();
    d1.setDate(d1.getDate() + 1);
    const d2 = new Date();
    d2.setDate(d2.getDate() + 3);
    setCheckIn(d1.toISOString().split('T')[0]);
    setCheckOut(d2.toISOString().split('T')[0]);
  }, [selectedRoom]);

  useEffect(() => {
    if (selectedRoom) {
      setRoomId(selectedRoom._id);
    }
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
    }
  }, [selectedRoom, user]);

  const currentRoom = rooms.find(r => r._id === roomId) || selectedRoom;
  const roomType = currentRoom?.type;

  // Ask the server for the real price (season, weekend, extra guests) and remaining inventory
  useEffect(() => {
    if (!isOpen || !roomType || !checkIn || !checkOut || checkOut <= checkIn) { setQuote(null); return; }
    let cancelled = false;
    api.get('/bookings/availability', { params: { checkIn, checkOut, adults, children } })
      .then((res) => {
        if (cancelled) return;
        const t = res.data.types.find((x) => x.type.name === roomType);
        const plan = t?.plans.find((p) => p.code === 'BAR') || t?.plans[0];
        setQuote(t && plan ? { free: t.free, fits: t.fits, total: plan.total, average: plan.average, taxes: res.data.taxes, plan } : null);
      })
      .catch(() => !cancelled && setQuote(null));
    return () => { cancelled = true; };
  }, [isOpen, roomType, checkIn, checkOut, adults, children]);

  if (!isOpen) return null;

  const nights = checkIn && checkOut ? Math.max(1, calculateNights(checkIn, checkOut)) : 1;
  const roomCharge = quote ? quote.total : currentRoom ? currentRoom.price * nights : 0;
  const serviceFee = quote ? Math.round(roomCharge * quote.taxes.serviceChargeRate / 100) : 0;
  const vatFee = quote ? Math.round((roomCharge + serviceFee) * quote.taxes.vatRate / 100) : 0;
  const totalPrice = roomCharge + serviceFee + vatFee;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        roomId,
        checkIn,
        checkOut,
        guests: { adults: Number(adults), children: Number(children) },
        guestInfo: formData,
        paymentMethod
      };
      const res = await api.post('/bookings', payload);
      if (res.data.success) {
        setSuccessBooking(res.data.booking);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi đặt phòng.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccessBooking(null);
    setError('');
    onClose();
  };

  return (
    <div className="booking-modal-backdrop" onClick={handleClose}>
      <div className="booking-modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={handleClose}>
          <FiX />
        </button>

        {successBooking ? (
          <div className="booking-success-view">
            <div className="success-icon-wrap">
              <FiCheckCircle />
            </div>
            <h3 className="success-title">Đặt Phòng Thành Công!</h3>
            <p className="success-sub">
              Cảm ơn quý khách <strong>{successBooking.guestInfo?.name}</strong> đã lựa chọn LumiStay.
            </p>

            <div className="booking-code-card">
              <span>MÃ ĐẶT PHÒNG CỦA BẠN:</span>
              <strong className="code-text">{successBooking.bookingCode}</strong>
              <small>Vui lòng lưu lại mã này để tra cứu hoặc làm thủ tục nhận phòng.</small>
            </div>

            <div className="booking-summary-mini">
              <div className="summary-row">
                <span>Hạng phòng:</span>
                <strong>{successBooking.room?.name || currentRoom?.name || successBooking.roomType}</strong>
              </div>
              <div className="summary-row">
                <span>Thời gian:</span>
                <span>{new Date(successBooking.checkIn).toLocaleDateString('vi-VN')} - {new Date(successBooking.checkOut).toLocaleDateString('vi-VN')} ({successBooking.nights} đêm)</span>
              </div>
              <div className="summary-row">
                <span>Tổng chi phí:</span>
                <strong className="highlight-price">{formatPrice(successBooking.money?.grand ?? successBooking.totalPrice)}</strong>
              </div>
            </div>

            <div className="modal-actions-center">
              <button className="btn btn-primary" onClick={handleClose}>
                Hoàn tất
              </button>
            </div>
          </div>
        ) : (
          <div className="booking-form-view">
            <div className="modal-header">
              <span className="section-label">ĐẶT PHÒNG TRỰC TUYẾN</span>
              <h2 className="modal-title">LumiStay Hotel & Resort</h2>
            </div>

            {error && <div className="error-alert">{error}</div>}

            <form onSubmit={handleSubmit} className="booking-grid-form">
              {/* Room Selection */}
              <div className="form-group full-width">
                <label className="form-label">Chọn Hạng Phòng</label>
                <select 
                  className="form-input" 
                  value={roomId} 
                  onChange={(e) => setRoomId(e.target.value)}
                  required
                >
                  {rooms.map(r => (
                    <option key={r._id} value={r._id}>
                      {r.name} - {formatPrice(r.price)}/đêm ({r.area}m² - tối đa {r.maxGuests} khách)
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="form-group">
                <label className="form-label">Ngày Nhận Phòng</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={checkIn}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setCheckIn(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ngày Trả Phòng</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={checkOut}
                  min={checkIn}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required 
                />
              </div>

              {/* Guests */}
              <div className="form-group">
                <label className="form-label">Người Lớn</label>
                <select 
                  className="form-input" 
                  value={adults} 
                  onChange={(e) => setAdults(e.target.value)}
                >
                  <option value="1">1 người</option>
                  <option value="2">2 người</option>
                  <option value="3">3 người</option>
                  <option value="4">4 người</option>
                  <option value="6">6 người</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Trẻ Em (dưới 12 tuổi)</label>
                <select 
                  className="form-input" 
                  value={children} 
                  onChange={(e) => setChildren(e.target.value)}
                >
                  <option value="0">0 trẻ em</option>
                  <option value="1">1 trẻ em</option>
                  <option value="2">2 trẻ em</option>
                  <option value="3">3 trẻ em</option>
                </select>
              </div>

              {/* Guest Details */}
              <div className="form-group">
                <label className="form-label">Họ và Tên</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Nguyễn Văn A"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Số Điện Thoại</label>
                <input 
                  type="tel" 
                  className="form-input" 
                  placeholder="0912 345 678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Địa Chỉ Email</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              {/* Payment Method */}
              <div className="form-group full-width">
                <label className="form-label">Phương Thức Thanh Toán</label>
                <div className="payment-options-row">
                  <label className={`payment-pill ${paymentMethod === 'transfer' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="payment" 
                      value="transfer" 
                      checked={paymentMethod === 'transfer'} 
                      onChange={() => setPaymentMethod('transfer')} 
                    />
                    <span>Chuyển khoản ngân hàng (QR Code)</span>
                  </label>
                  <label className={`payment-pill ${paymentMethod === 'cash' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="payment" 
                      value="cash" 
                      checked={paymentMethod === 'cash'} 
                      onChange={() => setPaymentMethod('cash')} 
                    />
                    <span>Thanh toán tại quầy lễ tân</span>
                  </label>
                  <label className={`payment-pill ${paymentMethod === 'card' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="payment" 
                      value="card" 
                      checked={paymentMethod === 'card'} 
                      onChange={() => setPaymentMethod('card')} 
                    />
                    <span>Thẻ tín dụng / Ghi nợ quốc tế</span>
                  </label>
                </div>
              </div>

              {/* Price Calculation Card */}
              <div className="pricing-summary-card full-width">
                <div className="price-item">
                  <span>Giá phòng trung bình mỗi đêm:</span>
                  <strong>{formatPrice(quote ? quote.average : currentRoom?.price || 0)}</strong>
                </div>
                <div className="price-item">
                  <span>Số đêm lưu trú:</span>
                  <strong>{nights} đêm</strong>
                </div>
                {quote && (
                  <>
                    <div className="price-item"><span>Phí phục vụ ({quote.taxes.serviceChargeRate}%):</span><strong>{formatPrice(serviceFee)}</strong></div>
                    <div className="price-item"><span>VAT ({quote.taxes.vatRate}%):</span><strong>{formatPrice(vatFee)}</strong></div>
                    {quote.free < 1 && <div className="error-alert">Hạng phòng này đã hết phòng trong thời gian đã chọn.</div>}
                    {!quote.fits && <div className="error-alert">Số khách vượt quá sức chứa của hạng phòng này.</div>}
                  </>
                )}
                <div className="price-divider"></div>
                <div className="price-total">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="total-gold-price">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              {/* Submit */}
              <div className="form-group full-width submit-row">
                <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
                  {loading ? 'Đang xử lý...' : `Xác Nhận Đặt Phòng (${formatPrice(totalPrice)})`}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
