import React, { useState, useEffect } from 'react';
import { 
  FiHome, FiCalendar, FiDollarSign, FiUsers, FiPlus, FiEdit2, 
  FiTrash2, FiCheck, FiX, FiRefreshCw, FiLock, FiMail, FiLogOut 
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatPrice, getStatusColor, getStatusLabel, getPaymentLabel } from '../utils/helpers';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, isAdmin, login, logout, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings');
  
  // Login form state for non-authenticated admins
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    totalRevenue: 0
  });
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: '',
    type: 'Deluxe',
    price: 2000000,
    area: 45,
    maxGuests: 2,
    bedrooms: 1,
    description: '',
    images: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
    amenities: 'WiFi miễn phí, Smart TV, Minibar, Điều hòa'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, bookingsRes, roomsRes] = await Promise.all([
        api.get('/bookings/admin/stats'),
        api.get('/bookings?limit=50'),
        api.get('/rooms')
      ]);

      if (statsRes.data?.stats) setStats(statsRes.data.stats);
      if (bookingsRes.data?.bookings) setBookings(bookingsRes.data.bookings);
      if (roomsRes.data?.rooms) setRooms(roomsRes.data.rooms);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const data = await login(adminEmail, adminPassword);
      if (data.user?.role !== 'admin') {
        setLoginError('Tài khoản này không có quyền truy cập trang quản trị.');
        logout();
      }
    } catch (err) {
      setLoginError(err.message || 'Đăng nhập thất bại.');
    } finally {
      setLoginLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setAdminEmail('admin@lumistay.com');
    setAdminPassword('admin123456');
  };

  if (authLoading) {
    return (
      <div className="loading-container" style={{ minHeight: '80vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // If not logged in as Admin, show the private Admin Login Portal
  if (!user || !isAdmin) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-box animate-fade-up">
          <div className="admin-login-header">
            <span className="admin-portal-badge">PORTAL NỘI BỘ</span>
            <div className="admin-brand-wrap">
              <span className="gold-sparkle">✧</span>
              <h2>LumiStay Admin</h2>
            </div>
            <p className="admin-portal-sub">Đăng nhập dành riêng cho Ban Quản Lý Khách Sạn</p>
          </div>

          {loginError && <div className="error-alert">{loginError}</div>}

          <form onSubmit={handleAdminLogin} className="admin-auth-form">
            <div className="form-group">
              <label className="form-label">Email Quản Trị</label>
              <div className="auth-input-wrap">
                <FiMail className="input-icon" />
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="admin@lumistay.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mật Khẩu</label>
              <div className="auth-input-wrap">
                <FiLock className="input-icon" />
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            <button type="submit" disabled={loginLoading} className="btn btn-primary btn-lg w-full">
              {loginLoading ? 'Đang xác thực...' : 'Đăng Nhập Quản Trị'}
            </button>
          </form>

          <div className="quick-demo-login">
            <span>Tài khoản Quản Trị viên mẫu:</span>
            <button type="button" className="btn-demo-quick" onClick={fillAdminCredentials}>
              Điền nhanh tài khoản Admin (admin@lumistay.com)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Admin Dashboard
  const handleUpdateBookingStatus = async (id, status, paymentStatus) => {
    try {
      await api.put(`/bookings/${id}/status`, { status, paymentStatus });
      fetchData();
    } catch (err) {
      alert('Cập nhật thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa phòng này?')) return;
    try {
      await api.delete(`/rooms/${id}`);
      fetchData();
    } catch (err) {
      alert('Xóa phòng thất bại: ' + err.message);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newRoom,
        images: [newRoom.images],
        amenities: newRoom.amenities.split(',').map(s => s.trim())
      };
      await api.post('/rooms', payload);
      setShowAddRoomModal(false);
      setNewRoom({
        name: '',
        type: 'Deluxe',
        price: 2000000,
        area: 45,
        maxGuests: 2,
        bedrooms: 1,
        description: '',
        images: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
        amenities: 'WiFi miễn phí, Smart TV, Minibar, Điều hòa'
      });
      fetchData();
    } catch (err) {
      alert('Tạo phòng thất bại: ' + err.message);
    }
  };

  return (
    <div className="admin-page">
      <div className="container admin-container">
        {/* Header */}
        <div className="admin-top-bar">
          <div>
            <span className="section-label">HỆ THỐNG QUẢN TRỊ NỘI BỘ</span>
            <h1 className="admin-main-title">Quản Lý LumiStay Resort</h1>
            <small style={{ color: '#64748b' }}>Đang đăng nhập với: <strong>{user?.name}</strong> ({user?.email})</small>
          </div>
          <div className="admin-top-actions">
            <button className="btn btn-secondary btn-sm" onClick={fetchData}>
              <FiRefreshCw /> Làm mới
            </button>
            <button className="btn btn-outline-white btn-sm btn-admin-logout" onClick={logout}>
              <FiLogOut /> Đăng xuất
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="stat-icon-circle blue"><FiCalendar /></div>
            <div>
              <span className="stat-lbl">Tổng đơn đặt phòng</span>
              <h3 className="stat-val">{stats.totalBookings}</h3>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon-circle yellow"><FiUsers /></div>
            <div>
              <span className="stat-lbl">Đơn chờ xác nhận</span>
              <h3 className="stat-val">{stats.pendingBookings}</h3>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon-circle green"><FiCheck /></div>
            <div>
              <span className="stat-lbl">Đơn đã xác nhận</span>
              <h3 className="stat-val">{stats.confirmedBookings}</h3>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon-circle gold"><FiDollarSign /></div>
            <div>
              <span className="stat-lbl">Tổng doanh thu</span>
              <h3 className="stat-val">{formatPrice(stats.totalRevenue)}</h3>
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="admin-nav-tabs">
          <button 
            className={`admin-tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            Quản Lý Đặt Phòng ({bookings.length})
          </button>
          <button 
            className={`admin-tab-btn ${activeTab === 'rooms' ? 'active' : ''}`}
            onClick={() => setActiveTab('rooms')}
          >
            Quản Lý Phòng ({rooms.length})
          </button>
        </div>

        {/* TAB 1: Bookings Management */}
        {activeTab === 'bookings' && (
          <div className="admin-table-card">
            <div className="table-responsive">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Mã Đặt</th>
                    <th>Khách Hàng</th>
                    <th>Phòng</th>
                    <th>Thời Gian</th>
                    <th>Tổng Tiền</th>
                    <th>Trạng Thái</th>
                    <th>Thanh Toán</th>
                    <th>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b._id}>
                      <td><strong className="code-pill">{b.bookingCode}</strong></td>
                      <td>
                        <div className="guest-col">
                          <strong>{b.guestInfo?.name}</strong>
                          <small>{b.guestInfo?.phone}</small>
                        </div>
                      </td>
                      <td>{b.room?.name || 'Phòng'}</td>
                      <td>
                        <small>
                          {new Date(b.checkIn).toLocaleDateString('vi-VN')} - {new Date(b.checkOut).toLocaleDateString('vi-VN')} ({b.nights} đêm)
                        </small>
                      </td>
                      <td><strong>{formatPrice(b.totalPrice)}</strong></td>
                      <td>
                        <span className={`badge ${getStatusColor(b.status)}`}>
                          {getStatusLabel(b.status)}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-navy">
                          {getPaymentLabel(b.paymentStatus)}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons-group">
                          {b.status === 'pending' && (
                            <button 
                              className="btn-action-sm confirm"
                              title="Xác nhận"
                              onClick={() => handleUpdateBookingStatus(b._id, 'confirmed', 'paid')}
                            >
                              <FiCheck /> Duyệt
                            </button>
                          )}
                          {b.status !== 'cancelled' && (
                            <button 
                              className="btn-action-sm cancel"
                              title="Hủy"
                              onClick={() => handleUpdateBookingStatus(b._id, 'cancelled', b.paymentStatus)}
                            >
                              <FiX /> Hủy
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Rooms Management */}
        {activeTab === 'rooms' && (
          <div className="admin-rooms-section">
            <div className="rooms-top-action">
              <h3>Danh Sách Các Hạng Phòng</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddRoomModal(true)}>
                <FiPlus /> Thêm Phòng Mới
              </button>
            </div>

            <div className="admin-rooms-grid">
              {rooms.map(room => (
                <div key={room._id} className="admin-room-card">
                  <img src={room.images?.[0]} alt={room.name} className="admin-room-img" />
                  <div className="admin-room-details">
                    <div className="admin-room-type">{room.type}</div>
                    <h4 className="admin-room-title">{room.name}</h4>
                    <p className="admin-room-specs">{room.area}m² • Tối đa {room.maxGuests} khách • {room.bedrooms} phòng ngủ</p>
                    <div className="admin-room-price">{formatPrice(room.price)} / đêm</div>

                    <div className="admin-room-actions">
                      <button 
                        className="btn-delete-room"
                        onClick={() => handleDeleteRoom(room._id)}
                      >
                        <FiTrash2 /> Xóa phòng
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Room Modal */}
        {showAddRoomModal && (
          <div className="booking-modal-backdrop" onClick={() => setShowAddRoomModal(false)}>
            <div className="booking-modal-box" onClick={e => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setShowAddRoomModal(false)}>✕</button>
              <h2 className="modal-title" style={{ marginBottom: '20px' }}>Thêm Phòng Mới</h2>

              <form onSubmit={handleCreateRoom} className="booking-grid-form">
                <div className="form-group full-width">
                  <label className="form-label">Tên Phòng</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="VD: Grand Ocean Suite" 
                    value={newRoom.name}
                    onChange={e => setNewRoom({...newRoom, name: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Loại Phòng</label>
                  <select 
                    className="form-input" 
                    value={newRoom.type}
                    onChange={e => setNewRoom({...newRoom, type: e.target.value})}
                  >
                    <option value="Deluxe">Deluxe</option>
                    <option value="Premier Suite">Premier Suite</option>
                    <option value="Family Room">Family Room</option>
                    <option value="Villa">Villa</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Giá (VNĐ / đêm)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={newRoom.price}
                    onChange={e => setNewRoom({...newRoom, price: Number(e.target.value)})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Diện tích (m²)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={newRoom.area}
                    onChange={e => setNewRoom({...newRoom, area: Number(e.target.value)})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Số khách tối đa</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={newRoom.maxGuests}
                    onChange={e => setNewRoom({...newRoom, maxGuests: Number(e.target.value)})}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">URL Hình Ảnh</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={newRoom.images}
                    onChange={e => setNewRoom({...newRoom, images: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Tiện Nghi (cách nhau bởi dấu phẩy)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={newRoom.amenities}
                    onChange={e => setNewRoom({...newRoom, amenities: e.target.value})}
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Mô Tả Phòng</label>
                  <textarea 
                    className="form-input" 
                    rows="3"
                    value={newRoom.description}
                    onChange={e => setNewRoom({...newRoom, description: e.target.value})}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary btn-lg full-width">
                  Tạo Phòng
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
