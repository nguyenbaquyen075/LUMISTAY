import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

export const vnd = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(n || 0)) + 'đ';
export const vndShort = (n) => {
  const v = n || 0;
  if (Math.abs(v) >= 1e9) return (v / 1e9).toFixed(2) + ' tỷ';
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + ' tr';
  return vnd(v);
};
export const pct = (x) => Math.round((x || 0) * 100) + '%';
export const errMsg = (e) => e?.response?.data?.message || e?.message || 'Có lỗi xảy ra.';
export const ymd = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
export const dmy = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

export const ROOM_STATUS = {
  available: { label: 'Trống', emoji: '🟢' },
  reserved: { label: 'Đã đặt', emoji: '🔵' },
  occupied: { label: 'Đang ở', emoji: '🔴' },
  cleaning: { label: 'Trống bẩn', emoji: '🟡' },
  maintenance: { label: 'Bảo trì', emoji: '🟠' },
  locked: { label: 'Khóa phòng', emoji: '⚫' }
};

export const BOOKING_STATUS = {
  pending: ['Chờ xác nhận', 'yellow'],
  confirmed: ['Đã xác nhận', 'blue'],
  checked_in: ['Đang ở', 'red'],
  checked_out: ['Đã trả phòng', 'gray'],
  cancelled: ['Đã hủy', 'gray'],
  no_show: ['No-show', 'orange']
};
export const PAY_STATUS = { unpaid: ['Chưa thanh toán', 'orange'], paid: ['Đã thanh toán', 'green'], refunded: ['Đã hoàn tiền', 'gray'] };
export const METHODS = { cash: 'Tiền mặt', card: 'Thẻ', transfer: 'Chuyển khoản', online: 'Online' };
export const ROLES = {
  admin: 'Super Admin', manager: 'Quản lý', receptionist: 'Lễ tân', housekeeping: 'Buồng phòng',
  cashier: 'Thu ngân', accountant: 'Kế toán', sales: 'Sales'
};
export const SOURCES = {
  website: 'Website', booking_com: 'Booking.com', agoda: 'Agoda', expedia: 'Expedia', traveloka: 'Traveloka',
  airbnb: 'Airbnb', walk_in: 'Khách vãng lai', phone: 'Điện thoại', corporate: 'Doanh nghiệp', other: 'Khác'
};
export const CHARGE_CATEGORIES = {
  service: 'Dịch vụ', food: 'Ăn uống', minibar: 'Minibar', laundry: 'Giặt ủi', spa: 'Spa', transport: 'Đưa đón', other: 'Khác', fee: 'Phí'
};
export const HK_STATUS = { clean: 'Sạch', dirty: 'Bẩn', inspected: 'Đã kiểm tra' };

export const Badge = ({ tone = 'gray', children }) => <span className={`ad-badge ${tone}`}>{children}</span>;
export const BookingBadge = ({ status }) => <Badge tone={BOOKING_STATUS[status]?.[1]}>{BOOKING_STATUS[status]?.[0] || status}</Badge>;
export const PayBadge = ({ status }) => <Badge tone={PAY_STATUS[status]?.[1]}>{PAY_STATUS[status]?.[0] || status}</Badge>;

export const Stat = ({ label, value, sub, tone }) => (
  <div className={`ad-stat ${tone || ''}`}>
    <span>{label}</span>
    <strong>{value}</strong>
    {sub && <small>{sub}</small>}
  </div>
);

// Portal: .main-content's page animation creates a stacking context that would put modals under the site header
export const Modal = ({ title, onClose, wide, children }) => createPortal(
  <div className="ad-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className={`ad-modal ${wide ? 'wide' : ''}`}>
      <div className="ad-modal-head">
        <h3>{title}</h3>
        <button onClick={onClose} aria-label="Đóng">×</button>
      </div>
      <div className="ad-modal-body">{children}</div>
    </div>
  </div>,
  document.body
);

export const Field = ({ label, full, children }) => (
  <div className={`ad-field ${full ? 'full' : ''}`}>
    <label>{label}</label>
    {children}
  </div>
);

// Tiny toast: const [notice, notify] = useNotice(); render {notice}
export const useNotice = () => {
  const [state, setState] = useState(null);
  const notify = useCallback((message, error = false) => {
    setState({ message, error });
    setTimeout(() => setState(null), 3500);
  }, []);
  return [state && createPortal(<div className={`ad-notice ${state.error ? 'error' : ''}`}>{state.message}</div>, document.body), notify];
};
