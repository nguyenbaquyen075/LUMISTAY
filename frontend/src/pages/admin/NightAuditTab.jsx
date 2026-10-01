import React, { useCallback, useEffect, useState } from 'react';
import api from '../../utils/api';
import { Stat, METHODS, errMsg, vnd, vndShort, pct, dmy } from './ui';

const NightAuditTab = ({ notify, can }) => {
  const [d, setD] = useState(null);
  const [busy, setBusy] = useState(false);
  const canRun = can('audit.run');

  const load = useCallback(() => api.get('/admin/night-audit').then((r) => setD(r.data)).catch((e) => notify(errMsg(e), true)), [notify]);
  useEffect(() => { load(); }, [load]);

  const run = async () => {
    if (!window.confirm(`Chốt ngày ${d.businessDate}? Khách chưa đến sẽ bị ghi nhận no-show (kèm phí theo chính sách).`)) return;
    setBusy(true);
    try { const r = await api.post('/admin/night-audit/run', {}); notify(r.data.message); load(); } catch (e) { notify(errMsg(e), true); } finally { setBusy(false); }
  };

  if (!d) return <div className="ad-empty">Đang tải...</div>;
  const issues = d.pendingArrivals.length + d.overdueDepartures.length;

  return (
    <>
      <div className="ad-card">
        <h3>Ngày làm việc cần chốt: {d.businessDate} <small>{d.lastClosed ? `đã chốt đến ${d.lastClosed}` : 'chưa chốt lần nào'}</small></h3>
        <div className="ad-grid c4">
          <Stat label="Khách đang ở" value={d.inHouse} />
          <Stat label="Chưa đến (sẽ thành no-show)" value={d.pendingArrivals.length} tone={d.pendingArrivals.length ? 'orange' : ''} />
          <Stat label="Quá hạn check-out" value={d.overdueDepartures.length} tone={d.overdueDepartures.length ? 'red' : ''} />
          <Stat label="Công nợ khách đang ở" value={vndShort(d.unpaidInHouse)} tone={d.unpaidInHouse ? 'orange' : ''} />
        </div>
        {d.pendingArrivals.length > 0 && (
          <div className="ad-section">
            <h4>Khách chưa đến</h4>
            <ul className="ad-list">{d.pendingArrivals.map((b) => <li key={b._id}><span>{b.bookingCode} · {b.guest} · {b.roomType}</span><span className="ad-hint">{dmy(b.checkIn)} → {dmy(b.checkOut)}</span></li>)}</ul>
          </div>
        )}
        {d.overdueDepartures.length > 0 && (
          <div className="ad-section">
            <h4>Quá hạn check-out (cần xử lý trước khi chốt)</h4>
            <ul className="ad-list">{d.overdueDepartures.map((b) => <li key={b._id}><span>{b.bookingCode} · {b.guest} · phòng {b.room}</span><span className="ad-hint">đáng lẽ đi {dmy(b.checkOut)}</span></li>)}</ul>
          </div>
        )}
        <p className="ad-hint">Chốt ngày sẽ: ghi nhận no-show, đánh dấu phòng đang có khách cần dọn, và lưu báo cáo cuối ngày (công suất, ADR, RevPAR, doanh thu, thu theo hình thức). {d.dirtyRooms} phòng đang bẩn.</p>
        {canRun && (
          <button className="ad-btn primary" disabled={busy || !d.canRun} onClick={run}>{d.canRun ? `Chốt ngày ${d.businessDate}${issues ? ` (${issues} việc cần xem)` : ''}` : 'Ngày này chưa kết thúc'}</button>
        )}
      </div>

      <div className="ad-card">
        <h3>Báo cáo cuối ngày đã chốt</h3>
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead><tr><th>Ngày</th><th>Công suất</th><th>ADR</th><th>RevPAR</th><th>Doanh thu phòng</th><th>Dịch vụ + ăn uống</th><th>Tổng doanh thu</th><th>Thu trong ngày</th><th>No-show</th><th>Chốt bởi</th></tr></thead>
            <tbody>
              {d.history.length === 0 && <tr><td colSpan="10" className="ad-empty">Chưa có ngày nào được chốt</td></tr>}
              {d.history.map((h) => (
                <tr key={h._id}>
                  <td><strong>{h.date}</strong></td>
                  <td>{pct(h.figures.occupancy)} <small>{h.figures.sold}/{h.figures.available}</small></td>
                  <td className="num">{vnd(h.figures.adr)}</td>
                  <td className="num">{vnd(h.figures.revpar)}</td>
                  <td className="num">{vnd(h.figures.roomRevenue)}</td>
                  <td className="num">{vnd(h.figures.serviceRevenue + h.figures.foodRevenue)}</td>
                  <td className="num"><strong>{vnd(h.figures.totalRevenue)}</strong></td>
                  <td>{Object.entries(h.payments || {}).map(([m, v]) => <small key={m}>{METHODS[m]}: {vnd(v)}</small>)}</td>
                  <td className="num">{h.noShows}</td>
                  <td>{h.runBy === 'Dữ liệu demo' ? 'Hệ thống' : h.runBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default NightAuditTab;
