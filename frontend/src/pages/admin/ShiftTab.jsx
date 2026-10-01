import React, { useCallback, useEffect, useState } from 'react';
import api from '../../utils/api';
import { Stat, METHODS, errMsg, vnd } from './ui';

const ShiftTab = ({ notify, can }) => {
  const [shift, setShift] = useState(undefined);
  const [history, setHistory] = useState([]);
  const [opening, setOpening] = useState('');
  const [counted, setCounted] = useState('');
  const [note, setNote] = useState('');

  const load = useCallback(() => {
    api.get('/admin/shifts/current').then((r) => setShift(r.data.shift)).catch((e) => notify(errMsg(e), true));
    api.get('/admin/shifts').then((r) => setHistory(r.data.shifts)).catch(() => {});
  }, [notify]);
  useEffect(() => { load(); }, [load]);

  const open = async (e) => {
    e.preventDefault();
    try { await api.post('/admin/shifts/open', { openingCash: +opening || 0 }); notify('Đã mở ca.'); setOpening(''); load(); } catch (err) { notify(errMsg(err), true); }
  };
  const close = async (e) => {
    e.preventDefault();
    if (!window.confirm('Kết ca? Sau khi kết ca bạn không thể thu tiền mặt cho đến khi mở ca mới.')) return;
    try {
      const r = await api.post('/admin/shifts/close', { countedCash: +counted, note });
      const v = r.data.shift.variance;
      notify(v === 0 ? 'Đã kết ca, tiền mặt khớp.' : `Đã kết ca. Chênh lệch: ${vnd(v)}`);
      setCounted(''); setNote(''); load();
    } catch (err) { notify(errMsg(err), true); }
  };

  if (shift === undefined) return <div className="ad-empty">Đang tải...</div>;
  return (
    <>
      {!shift ? (
        <div className="ad-card">
          <h3>Mở ca thu ngân</h3>
          <form className="ad-toolbar" onSubmit={open}>
            <input className="ad-input" type="number" min="0" placeholder="Tiền mặt đầu ca (đ)" value={opening} onChange={(e) => setOpening(e.target.value)} />
            <button className="ad-btn primary" type="submit">Mở ca</button>
            <span className="ad-hint">Cần mở ca trước khi thu hoặc hoàn tiền mặt cho khách.</span>
          </form>
        </div>
      ) : (
        <>
          <div className="ad-grid c4">
            <Stat label="Mở ca lúc" value={new Date(shift.openedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} />
            <Stat label="Tiền đầu ca" value={vnd(shift.openingCash)} />
            <Stat label="Thu tiền mặt trong ca (ròng)" value={vnd(shift.cashNet)} tone="green" />
            <Stat label="Tiền mặt dự kiến trong két" value={vnd(shift.expectedCash)} tone="blue" />
          </div>
          <div className="ad-grid c2">
            <div className="ad-card">
              <h3>Thu trong ca theo hình thức</h3>
              <ul className="ad-list">{Object.entries(shift.byMethod).map(([m, v]) => <li key={m}><span>{METHODS[m]}</span><span>{vnd(v)}</span></li>)}
                {Object.keys(shift.byMethod).length === 0 && <li><span className="ad-hint">Chưa có giao dịch</span></li>}</ul>
            </div>
            <div className="ad-card">
              <h3>Kết ca</h3>
              <form className="ad-form-grid" onSubmit={close}>
                <Field2 label="Tiền mặt kiểm đếm thực tế (đ)"><input className="ad-input" type="number" min="0" required value={counted} onChange={(e) => setCounted(e.target.value)} /></Field2>
                <Field2 label="Ghi chú"><input className="ad-input" value={note} onChange={(e) => setNote(e.target.value)} /></Field2>
                {counted !== '' && <div className={`full ad-alert ${+counted === shift.expectedCash ? 'ok' : 'warning'}`}>Chênh lệch: <strong>{vnd(+counted - shift.expectedCash)}</strong></div>}
                <div className="full"><button className="ad-btn danger" type="submit">Kết ca</button></div>
              </form>
            </div>
          </div>
        </>
      )}

      <div className="ad-card">
        <h3>Lịch sử ca {can('shift.view_all') ? '(tất cả nhân viên)' : 'của bạn'}</h3>
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead><tr><th>Nhân viên</th><th>Mở ca</th><th>Kết ca</th><th>Đầu ca</th><th>Dự kiến</th><th>Kiểm đếm</th><th>Chênh lệch</th><th>Ghi chú</th></tr></thead>
            <tbody>
              {history.length === 0 && <tr><td colSpan="8" className="ad-empty">Chưa có ca nào</td></tr>}
              {history.map((s) => (
                <tr key={s._id}>
                  <td>{s.userName}</td>
                  <td>{new Date(s.openedAt).toLocaleString('vi-VN')}</td>
                  <td>{s.closedAt ? new Date(s.closedAt).toLocaleString('vi-VN') : <strong style={{ color: '#198754' }}>Đang mở</strong>}</td>
                  <td className="num">{vnd(s.openingCash)}</td>
                  <td className="num">{s.status === 'closed' ? vnd(s.expectedCash) : '—'}</td>
                  <td className="num">{s.status === 'closed' ? vnd(s.countedCash) : '—'}</td>
                  <td className="num" style={{ color: s.variance ? '#dc3545' : undefined }}>{s.status === 'closed' ? vnd(s.variance) : '—'}</td>
                  <td>{s.note && s.note !== 'demo' ? s.note : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

// local alias to keep the form markup short
const Field2 = ({ label, children }) => <div className="ad-field"><label>{label}</label>{children}</div>;

export default ShiftTab;
