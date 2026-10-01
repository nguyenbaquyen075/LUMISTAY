import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Modal, METHODS, CHARGE_CATEGORIES, vnd, dmy, errMsg } from './ui';

const InvoiceModal = ({ bookingId, onClose }) => {
  const [inv, setInv] = useState(null);
  const [split, setSplit] = useState(false); // two invoices: room (company pays) / extras (guest pays)
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/bookings/${bookingId}/invoice`).then((r) => setInv(r.data.invoice)).catch((e) => setError(errMsg(e)));
  }, [bookingId]);

  const Part = ({ title, rows, part }) => (
    <div className="ad-report" style={{ marginBottom: 12 }}>
      {title && <strong>{title}</strong>}
      {rows}
      <div className="ad-row"><span>Cộng tiền hàng</span><span>{vnd(part.net)}</span></div>
      <div className="ad-row"><span>Phí phục vụ ({inv.serviceChargeRate}%)</span><span>{vnd(part.service)}</span></div>
      <div className="ad-row"><span>VAT ({inv.vatRate}%)</span><span>{vnd(part.vat)}</span></div>
      <div className="ad-row total"><span>TỔNG</span><span>{vnd(part.total)}</span></div>
    </div>
  );

  return (
    <Modal title="Hóa đơn" onClose={onClose}>
      {error && <div className="ad-alert warning">{error}</div>}
      {inv && (
        <div className="ad-print">
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <strong style={{ fontSize: 16, letterSpacing: 2 }}>{inv.hotel.name}</strong>
            <div className="ad-hint">{inv.hotel.address}{inv.hotel.phone ? ` · ${inv.hotel.phone}` : ''}{inv.hotel.taxCode ? ` · MST ${inv.hotel.taxCode}` : ''}</div>
            <div style={{ marginTop: 6 }}>HÓA ĐƠN LƯU TRÚ · {inv.bookingCode}</div>
          </div>
          <dl className="ad-kv" style={{ marginBottom: 12 }}>
            <dt>Khách</dt><dd>{inv.guest.name} · {inv.guest.phone}</dd>
            <dt>Phòng</dt><dd>{inv.room.roomNumber ? `${inv.room.roomNumber} · ` : ''}{inv.room.name || inv.room.type}</dd>
            <dt>Lưu trú</dt><dd>{dmy(inv.checkIn)} → {dmy(inv.checkOut)} ({inv.nights} đêm) · {inv.ratePlan}</dd>
          </dl>

          {split ? (
            <>
              <Part title="Hóa đơn 1 — Tiền phòng" part={inv.split.room} rows={<div className="ad-row"><span>Tiền phòng ({inv.nights} đêm{inv.discountPercent ? `, giảm ${inv.discountPercent}%` : ''})</span><span>{vnd(inv.roomTotal)}</span></div>} />
              <Part title="Hóa đơn 2 — Dịch vụ phát sinh" part={inv.split.extras} rows={inv.charges.filter((c) => c.category !== 'fee').map((c) => <div className="ad-row" key={c._id}><span>{c.label}</span><span>{vnd(c.amount)}</span></div>)} />
            </>
          ) : (
            <div className="ad-report">
              <div className="ad-row"><span>Tiền phòng ({inv.nights} đêm{inv.discountPercent ? `, giảm ${inv.discountPercent}%` : ''})</span><span>{vnd(inv.roomTotal)}</span></div>
              {inv.charges.filter((c) => c.category !== 'fee').map((c) => <div className="ad-row" key={c._id}><span>{c.label} <small className="ad-hint">({CHARGE_CATEGORIES[c.category]})</small></span><span>{vnd(c.amount)}</span></div>)}
              <div className="ad-row"><span>Phí phục vụ ({inv.serviceChargeRate}%)</span><span>{vnd(inv.service)}</span></div>
              <div className="ad-row"><span>VAT ({inv.vatRate}%)</span><span>{vnd(inv.vat)}</span></div>
              {inv.charges.filter((c) => c.category === 'fee').map((c) => <div className="ad-row" key={c._id}><span>{c.label} (không chịu thuế)</span><span>{vnd(c.amount)}</span></div>)}
              <div className="ad-row total"><span>TỔNG CỘNG</span><span>{vnd(inv.grand)}</span></div>
            </div>
          )}

          <div className="ad-report" style={{ marginTop: 8 }}>
            {inv.payments.map((p) => <div className="ad-row" key={p._id}><span>{p.type === 'refund' ? 'Hoàn tiền' : p.purpose === 'deposit' ? 'Đặt cọc' : 'Thanh toán'} · {METHODS[p.method]} · {dmy(p.at)}</span><span>{p.type === 'refund' ? '-' : ''}{vnd(p.amount)}</span></div>)}
            <div className="ad-row total"><span>CÒN PHẢI THU</span><span>{vnd(inv.balance)}</span></div>
          </div>
          {inv.qr && <div style={{ textAlign: 'center', marginTop: 10 }}><img src={inv.qr} alt="VietQR" style={{ width: 200 }} /><div className="ad-hint">Quét mã VietQR để chuyển khoản số tiền còn lại</div></div>}
          <div className="ad-actions ad-no-print" style={{ marginTop: 14 }}>
            <button className="ad-btn primary" onClick={() => window.print()}>In hóa đơn</button>
            <button className="ad-btn" onClick={() => setSplit(!split)}>{split ? 'Gộp thành 1 hóa đơn' : 'Tách hóa đơn (phòng / dịch vụ)'}</button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default InvoiceModal;
