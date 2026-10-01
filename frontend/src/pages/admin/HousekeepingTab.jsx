import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import { Badge, ROOM_STATUS, HK_STATUS, errMsg } from './ui';

const TONE = { clean: 'green', dirty: 'orange', inspected: 'blue' };

const HousekeepingTab = ({ notify, can, user }) => {
  const [rooms, setRooms] = useState([]);
  const [keepers, setKeepers] = useState([]);
  const [filter, setFilter] = useState(user.role === 'housekeeping' ? 'mine' : 'todo');
  const [picked, setPicked] = useState([]);
  const [assignee, setAssignee] = useState('');
  const manage = can('housekeeping.manage');

  const load = useCallback(() => {
    api.get('/admin/housekeeping').then((r) => setRooms(r.data.rooms)).catch((e) => notify(errMsg(e), true));
    api.get('/admin/housekeepers').then((r) => setKeepers(r.data.housekeepers)).catch(() => {});
  }, [notify]);
  useEffect(() => { load(); }, [load]);

  const task = (r) => (r.status !== 'available' ? null : r.occupied ? (r.hkStatus === 'dirty' ? 'Dọn phòng đang ở' : null) : r.hkStatus === 'dirty' ? 'Dọn phòng trống' : null);
  const visible = useMemo(() => rooms.filter((r) => {
    if (filter === 'todo') return task(r);
    if (filter === 'mine') return r.assignedTo?._id === user.id && task(r);
    if (filter === 'arrivals') return r.arrivalToday;
    return true;
  }), [rooms, filter, user.id]);

  const setHk = async (r, hkStatus) => {
    try { await api.put(`/rooms/${r._id}/housekeeping`, { hkStatus }); load(); } catch (e) { notify(errMsg(e), true); }
  };
  const assign = async () => {
    try { await api.post('/admin/housekeeping/assign', { roomIds: picked, userId: assignee || null }); notify('Đã phân công.'); setPicked([]); load(); } catch (e) { notify(errMsg(e), true); }
  };
  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const count = (f) => rooms.filter(f).length;

  return (
    <>
      <div className="ad-grid c4">
        <div className="ad-stat orange"><span>Cần dọn</span><strong>{count((r) => task(r))}</strong></div>
        <div className="ad-stat"><span>Trống bẩn (sau check-out)</span><strong>{count((r) => r.status === 'available' && !r.occupied && r.hkStatus === 'dirty')}</strong></div>
        <div className="ad-stat"><span>Phòng đang ở cần dọn</span><strong>{count((r) => r.occupied && r.hkStatus === 'dirty')}</strong></div>
        <div className="ad-stat red"><span>Bẩn nhưng có khách đến hôm nay</span><strong>{count((r) => r.arrivalToday && r.hkStatus === 'dirty')}</strong></div>
      </div>

      <div className="ad-toolbar">
        <div className="ad-tabs">
          {[['todo', 'Cần dọn'], ['mine', 'Của tôi'], ['arrivals', 'Khách đến hôm nay'], ['all', 'Tất cả']].map(([k, l]) => (
            <button key={k} className={filter === k ? 'active' : ''} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
        <span className="grow" />
        {manage && (
          <>
            <select className="ad-select" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              <option value="">Bỏ phân công</option>
              {keepers.map((k) => <option key={k._id} value={k._id}>{k.name}</option>)}
            </select>
            <button className="ad-btn primary" disabled={!picked.length} onClick={assign}>Phân công {picked.length || ''} phòng</button>
          </>
        )}
      </div>

      <div className="ad-card">
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead><tr>{manage && <th />}<th>Phòng</th><th>Tầng</th><th>Hạng</th><th>Tình trạng</th><th>Buồng phòng</th><th>Công việc</th><th>Phụ trách</th><th>Ghi chú</th><th /></tr></thead>
            <tbody>
              {visible.length === 0 && <tr><td colSpan="10" className="ad-empty">Không có phòng nào</td></tr>}
              {visible.map((r) => (
                <tr key={r._id}>
                  {manage && <td><input type="checkbox" checked={picked.includes(r._id)} onChange={() => toggle(r._id)} /></td>}
                  <td><strong>{r.roomNumber || '—'}</strong>{r.arrivalToday && <small style={{ color: '#b45309' }}>Khách đến hôm nay</small>}</td>
                  <td>{r.floor}</td>
                  <td>{r.type}</td>
                  <td>{ROOM_STATUS[r.displayStatus].label}{r.guest && <small>{r.guest}</small>}{r.departureToday && <small>Trả phòng hôm nay</small>}</td>
                  <td><Badge tone={TONE[r.hkStatus]}>{HK_STATUS[r.hkStatus]}</Badge></td>
                  <td>{task(r) || '—'}</td>
                  <td>{r.assignedTo?.name || '—'}</td>
                  <td>{r.hkNote || ''}</td>
                  <td>
                    <div className="ad-actions">
                      {r.hkStatus === 'dirty' && <button className="ad-btn sm primary" onClick={() => setHk(r, 'clean')}>Đã dọn xong</button>}
                      {r.hkStatus === 'clean' && manage && !r.occupied && <button className="ad-btn sm" onClick={() => setHk(r, 'inspected')}>Đã kiểm tra</button>}
                      {r.hkStatus !== 'dirty' && <button className="ad-btn sm" onClick={() => setHk(r, 'dirty')}>Đánh dấu bẩn</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="ad-hint" style={{ marginTop: 10 }}>Check-out tự chuyển phòng sang “bẩn”. Khi chốt ngày, mọi phòng đang có khách cũng được đánh dấu cần dọn (dọn buồng hằng ngày). Phòng bẩn không thể nhận khách.</p>
      </div>
    </>
  );
};

export default HousekeepingTab;
