import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Badge, BookingBadge, Field, Modal, errMsg, vnd, dmy, ymd } from './ui';

const SEG_TONE = { 'Khách có giá trị cao': 'gold', 'Khách thường xuyên': 'green', 'Khách có nguy cơ không quay lại': 'red', 'Khách mới': 'blue', 'Khách thường': 'gray' };
const VIP = { none: 'Thường', silver: 'VIP Bạc', gold: 'VIP Vàng', platinum: 'VIP Bạch kim' };

const CustomerDetail = ({ email, onClose, onSaved, notify, can }) => {
  const [c, setC] = useState(null);
  useEffect(() => {
    api.get(`/admin/customers/${encodeURIComponent(email)}`).then((r) => setC(r.data.customer)).catch((e) => notify(errMsg(e), true));
  }, [email, notify]);
  if (!c) return <Modal title="Khách hàng" onClose={onClose}><div className="ad-empty">Đang tải...</div></Modal>;

  const set = (k) => (e) => setC({ ...c, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const manager = can('cancel.waive');
  const save = async () => {
    const body = { name: c.name, phone: c.phone, idNumber: c.idNumber, nationality: c.nationality, notes: c.notes, dob: c.dob || undefined, preferences: c.preferences, marketingConsent: c.marketingConsent };
    if (manager) Object.assign(body, { vipLevel: c.vipLevel, blacklisted: c.blacklisted, blacklistReason: c.blacklistReason });
    try { await api.put(`/admin/customers/${encodeURIComponent(email)}`, body); notify('Đã lưu hồ sơ khách.'); onSaved(); } catch (e) { notify(errMsg(e), true); }
  };

  return (
    <Modal wide title={c.name} onClose={onClose}>
      <div className="ad-alert info">{c.insight}</div>
      {c.blacklisted && <div className="ad-alert warning"><strong>Danh sách đen:</strong> {c.blacklistReason || 'không rõ lý do'}</div>}
      <div className="ad-actions ad-section"><Badge tone={SEG_TONE[c.segment]}>{c.segment}</Badge>{c.vipLevel !== 'none' && <Badge tone="gold">{VIP[c.vipLevel]}</Badge>}<span className="ad-hint">{c.bookings} lần đặt · tổng chi {vnd(c.spent)}</span></div>
      <div className="ad-grid c2">
        <div className="ad-form-grid">
          <Field label="Họ tên"><input className="ad-input" value={c.name} onChange={set('name')} /></Field>
          <Field label="SĐT"><input className="ad-input" value={c.phone} onChange={set('phone')} /></Field>
          <Field label="Email"><input className="ad-input" value={c.email} disabled /></Field>
          <Field label="CCCD / Hộ chiếu"><input className="ad-input" value={c.idNumber} onChange={set('idNumber')} /></Field>
          <Field label="Quốc tịch"><input className="ad-input" value={c.nationality} onChange={set('nationality')} /></Field>
          <Field label="Ngày sinh"><input className="ad-input" type="date" value={c.dob ? ymd(c.dob) : ''} onChange={set('dob')} /></Field>
          <Field label="Sở thích / yêu cầu thường gặp" full><input className="ad-input" value={c.preferences} onChange={set('preferences')} placeholder="Gối cao, phòng yên tĩnh..." /></Field>
          <Field label="Ghi chú đặc biệt" full><textarea className="ad-textarea" rows={2} value={c.notes} onChange={set('notes')} /></Field>
          <label className="full"><input type="checkbox" checked={c.marketingConsent} onChange={set('marketingConsent')} /> Đồng ý nhận thông tin khuyến mãi</label>
          {manager && (
            <>
              <Field label="Hạng khách"><select className="ad-select" value={c.vipLevel} onChange={set('vipLevel')}>{Object.entries(VIP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
              <label style={{ alignSelf: 'flex-end' }}><input type="checkbox" checked={c.blacklisted} onChange={set('blacklisted')} /> Danh sách đen</label>
              {c.blacklisted && <Field label="Lý do" full><input className="ad-input" value={c.blacklistReason} onChange={set('blacklistReason')} /></Field>}
            </>
          )}
          {can('customers.edit') && <div className="full"><button className="ad-btn primary" onClick={save}>Lưu hồ sơ</button></div>}
        </div>
        <div>
          <div className="ad-section">
            <h4>Lịch sử lưu trú</h4>
            <ul className="ad-list" style={{ maxHeight: 240, overflowY: 'auto' }}>
              {c.stays.map((s) => (
                <li key={s._id}><span>{s.room}<small className="ad-hint"> · {dmy(s.checkIn)} → {dmy(s.checkOut)} · {vnd(s.total)}</small></span><BookingBadge status={s.status} /></li>
              ))}
            </ul>
          </div>
          <div className="ad-section">
            <h4>Đánh giá</h4>
            {c.reviews.length === 0 ? <div className="ad-hint">Chưa có đánh giá.</div> : c.reviews.map((r, i) => (
              <div key={i} className="ad-alert">{'★'.repeat(r.rating)} <strong>{r.title}</strong><br />{r.content}</div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

const CustomersTab = ({ notify, can }) => {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => api.get('/admin/customers', { params: { q } }).then((r) => setList(r.data.customers)).catch((e) => notify(errMsg(e), true)), 250);
    return () => clearTimeout(t);
  }, [q, tick, notify]);

  return (
    <>
      <div className="ad-toolbar"><input className="ad-input grow" placeholder="Tìm tên, SĐT, email, CCCD..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="ad-card">
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead><tr><th>Khách hàng</th><th>CCCD/Hộ chiếu</th><th>Quốc tịch</th><th>Số lần đặt</th><th>Tổng chi</th><th>Lần ở gần nhất</th><th>Phân nhóm</th></tr></thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan="7" className="ad-empty">Chưa có khách hàng</td></tr>}
              {list.map((c) => (
                <tr key={c.email} className="click" onClick={() => setOpen(c.email)}>
                  <td>{c.name} {c.vipLevel !== 'none' && <Badge tone="gold">{VIP[c.vipLevel]}</Badge>} {c.blacklisted && <Badge tone="red">Danh sách đen</Badge>}<small>{c.phone} · {c.email}</small></td>
                  <td>{c.idNumber || '—'}</td>
                  <td>{c.nationality}</td>
                  <td className="num">{c.bookings}</td>
                  <td className="num">{vnd(c.spent)}</td>
                  <td>{dmy(c.lastStay)}</td>
                  <td><Badge tone={SEG_TONE[c.segment]}>{c.segment}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {open && <CustomerDetail email={open} notify={notify} can={can} onClose={() => setOpen(null)} onSaved={() => setTick(tick + 1)} />}
    </>
  );
};

export default CustomersTab;
