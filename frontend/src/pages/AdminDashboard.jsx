import React, { useState } from 'react';
import { FiLock, FiMail } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useNotice, ROLES } from './admin/ui';
import DashboardTab from './admin/DashboardTab';
import RoomsTab from './admin/RoomsTab';
import HousekeepingTab from './admin/HousekeepingTab';
import BookingsTab from './admin/BookingsTab';
import CustomersTab from './admin/CustomersTab';
import ResidenceTab from './admin/ResidenceTab';
import ShiftTab from './admin/ShiftTab';
import NightAuditTab from './admin/NightAuditTab';
import ReportsTab from './admin/ReportsTab';
import FinanceTab from './admin/FinanceTab';
import PricingTab from './admin/PricingTab';
import SettingsTab from './admin/SettingsTab';
import AuditTab from './admin/AuditTab';
import StaffTab from './admin/StaffTab';
import AiTab from './admin/AiTab';
import './AdminDashboard.css';
import './admin/admin.css';

// Each tab needs ANY of its permissions (the API enforces the same rules). `group` only draws a divider.
const TABS = [
  { id: 'dashboard', label: 'Tổng quan', perms: ['dashboard'], group: 'Vận hành' },
  { id: 'bookings', label: 'Đặt phòng', perms: ['bookings.view'] },
  { id: 'rooms', label: 'Sơ đồ phòng', perms: ['rooms.view'] },
  { id: 'housekeeping', label: 'Buồng phòng', perms: ['housekeeping.view'] },
  { id: 'customers', label: 'Khách hàng', perms: ['customers.view'] },
  { id: 'residence', label: 'Khai báo lưu trú', perms: ['residence'] },
  { id: 'shift', label: 'Ca thu ngân', perms: ['shift.use'], group: 'Thu chi' },
  { id: 'nightaudit', label: 'Chốt ngày', perms: ['audit.run', 'audit.view'] },
  { id: 'finance', label: 'Tài chính', perms: ['finance.view'] },
  { id: 'reports', label: 'Báo cáo', perms: ['reports.view'] },
  { id: 'ai', label: 'AI', perms: ['ai.use'] },
  { id: 'pricing', label: 'Giá & hạng phòng', perms: ['rates.view'], group: 'Thiết lập' },
  { id: 'settings', label: 'Cấu hình', perms: ['settings.view'] },
  { id: 'staff', label: 'Nhân viên', perms: ['staff.manage'] },
  { id: 'audit', label: 'Nhật ký', perms: ['audit.view'] }
];

const AdminDashboard = () => {
  const { user, isAdmin, can, login, logout, loading: authLoading } = useAuth();
  const [tab, setTab] = useState(null);
  const [notice, notify] = useNotice();
  
  // Login form state for non-authenticated admins
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const data = await login(adminEmail, adminPassword);
      if (!data.user?.role || data.user.role === 'guest') {
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

  // Authenticated staff area
  const tabs = TABS.filter((t) => t.perms.some(can));
  const current = tabs.find((t) => t.id === tab) || tabs[0];
  if (!current) return <div className="ad-page"><p style={{ padding: 40 }}>Tài khoản chưa được cấp quyền nào. Vui lòng liên hệ Super Admin.</p></div>;

  const props = { notify, can, user };
  const content = {
    dashboard: <DashboardTab {...props} />,
    bookings: <BookingsTab {...props} />,
    rooms: <RoomsTab {...props} />,
    housekeeping: <HousekeepingTab {...props} />,
    customers: <CustomersTab {...props} />,
    residence: <ResidenceTab {...props} />,
    shift: <ShiftTab {...props} />,
    nightaudit: <NightAuditTab {...props} />,
    finance: <FinanceTab {...props} />,
    reports: <ReportsTab {...props} />,
    ai: <AiTab {...props} />,
    pricing: <PricingTab {...props} />,
    settings: <SettingsTab {...props} />,
    staff: <StaffTab me={user} {...props} />,
    audit: <AuditTab {...props} />
  }[current.id];

  return (
    <div className="ad-page">
      <header className="ad-top">
        <div className="ad-brand"><strong>LumiStay</strong><small>Hệ thống quản trị khách sạn</small></div>
        <div className="ad-user">
          <div><strong>{user.name}</strong><small>{ROLES[user.role]}</small></div>
          <button className="ad-btn sm btn-admin-logout" onClick={logout}>Đăng xuất</button>
        </div>
      </header>
      <div className="ad-body">
        <nav className="ad-nav">
          {tabs.map((t) => (
            <React.Fragment key={t.id}>
              {t.group && <div className="ad-nav-group">{t.group}</div>}
              <button className={`ad-nav-btn ${t.id === current.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
            </React.Fragment>
          ))}
        </nav>
        <main className="ad-main">
          <div className="ad-title"><h1>{current.label}</h1></div>
          {/* key remounts the tab so every visit refetches fresh data */}
          <React.Fragment key={current.id}>{content}</React.Fragment>
        </main>
      </div>
      {notice}
    </div>
  );
};

export default AdminDashboard;
