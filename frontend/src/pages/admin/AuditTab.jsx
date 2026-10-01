import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Badge, ROLES, errMsg } from './ui';

const ENTITIES = { booking: 'Đặt phòng', room: 'Phòng', roomtype: 'Hạng phòng', rateplan: 'Gói giá', settings: 'Cấu hình', staff: 'Nhân viên', expense: 'Chi phí', shift: 'Ca thu ngân', nightaudit: 'Chốt ngày', customer: 'Khách hàng' };

const AuditTab = ({ notify }) => {
  const [data, setData] = useState({ logs: [], total: 0 });
  const [q, setQ] = useState('');
  const [entity, setEntity] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 50;

  useEffect(() => {
    const t = setTimeout(() => api.get('/admin/audit', { params: { q, entity, page, limit: LIMIT } }).then((r) => setData(r.data)).catch((e) => notify(errMsg(e), true)), 250);
    return () => clearTimeout(t);
  }, [q, entity, page, notify]);
  const pages = Math.max(1, Math.ceil(data.total / LIMIT));

  return (
    <>
      <div className="ad-toolbar">
        <input className="ad-input grow" placeholder="Tìm theo người thực hiện, nội dung..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <select className="ad-select" value={entity} onChange={(e) => { setEntity(e.target.value); setPage(1); }}>
          <option value="">Tất cả đối tượng</option>
          {Object.entries(ENTITIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="ad-card">
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Hành động</th><th>Đối tượng</th><th>Chi tiết</th></tr></thead>
            <tbody>
              {data.logs.length === 0 && <tr><td colSpan="5" className="ad-empty">Chưa có nhật ký</td></tr>}
              {data.logs.map((l) => (
                <tr key={l._id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(l.at).toLocaleString('vi-VN')}</td>
                  <td>{l.userName}{l.role && l.role !== 'demo' && <small>{ROLES[l.role] || l.role}</small>}</td>
                  <td><Badge tone="blue">{l.action}</Badge></td>
                  <td>{ENTITIES[l.entity] || l.entity}</td>
                  <td>{l.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ad-toolbar" style={{ marginTop: 12, marginBottom: 0, justifyContent: 'space-between' }}>
          <span className="ad-hint">{data.total} bản ghi</span>
          <div className="ad-actions">
            <button className="ad-btn sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹ Trước</button>
            <span className="ad-hint" style={{ alignSelf: 'center' }}>{page}/{pages}</span>
            <button className="ad-btn sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Sau ›</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuditTab;
