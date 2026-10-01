import React, { useCallback, useEffect, useState } from 'react';
import api from '../../utils/api';
import { Badge, BookingBadge, errMsg, dmy } from './ui';

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

const ResidenceTab = ({ notify }) => {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('todo');

  const load = useCallback(() => api.get('/admin/residence').then((r) => setRows(r.data.bookings)).catch((e) => notify(errMsg(e), true)), [notify]);
  useEffect(() => { load(); }, [load]);

  const mark = async (b, registered) => {
    try { await api.put(`/bookings/${b._id}/residence`, { registered }); load(); } catch (e) { notify(errMsg(e), true); }
  };
  const shown = rows.filter((b) => (filter === 'todo' ? !b.residence?.registered : filter === 'missing' ? b.missingId : true));

  // One line per person staying (primary guest if no occupants were entered)
  const exportCsv = () => {
    const head = ['Họ tên', 'Giới tính', 'Ngày sinh', 'Quốc tịch', 'Loại giấy tờ', 'Số giấy tờ', 'Ngày nhập cảnh', 'Phòng', 'Ngày đến', 'Ngày đi', 'Mã đặt phòng'];
    const lines = [];
    for (const b of shown) {
      const people = b.occupants.length ? b.occupants : [{ name: b.guestInfo.name, idType: 'cccd', idNumber: b.guestInfo.idNumber, nationality: b.guestInfo.nationality }];
      for (const p of people) {
        lines.push([p.name, { male: 'Nam', female: 'Nữ', other: 'Khác' }[p.gender] || '', p.dob ? dmy(p.dob) : '', p.nationality, p.idType === 'passport' ? 'Hộ chiếu' : 'CCCD', p.idNumber, p.entryDate ? dmy(p.entryDate) : '', b.room || '', dmy(b.checkIn), dmy(b.checkOut), b.bookingCode].map(csvCell).join(','));
      }
    }
    const blob = new Blob(['﻿' + [head.map(csvCell).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `khai-bao-luu-tru-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <>
      <div className="ad-toolbar">
        <div className="ad-tabs">
          {[['todo', 'Chưa khai báo'], ['missing', 'Thiếu giấy tờ'], ['all', 'Tất cả']].map(([k, l]) => <button key={k} className={filter === k ? 'active' : ''} onClick={() => setFilter(k)}>{l}</button>)}
        </div>
        <span className="grow ad-hint">Khách đang ở và khách đến hôm nay. Khách nước ngoài cần hộ chiếu, visa và ngày nhập cảnh.</span>
        <button className="ad-btn" onClick={exportCsv}>Xuất CSV</button>
      </div>
      <div className="ad-card">
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead><tr><th>Phòng</th><th>Khách</th><th>Giấy tờ</th><th>Quốc tịch</th><th>Lưu trú</th><th>Trạng thái</th><th>Khai báo</th><th /></tr></thead>
            <tbody>
              {shown.length === 0 && <tr><td colSpan="8" className="ad-empty">Không có khách nào cần xử lý</td></tr>}
              {shown.map((b) => (
                <tr key={b._id}>
                  <td><strong>{b.room || '—'}</strong><small>{b.roomType}</small></td>
                  <td>{b.guest}<small>{b.occupants.length || 1} người</small></td>
                  <td>{b.missingId ? <Badge tone="red">Thiếu</Badge> : b.guestInfo.idNumber || b.occupants.find((o) => o.idNumber)?.idNumber}</td>
                  <td>{b.guestInfo.nationality}</td>
                  <td>{dmy(b.checkIn)} → {dmy(b.checkOut)}</td>
                  <td><BookingBadge status={b.status} /></td>
                  <td>{b.residence?.registered ? <Badge tone="green">Đã khai báo</Badge> : <Badge tone="orange">Chưa</Badge>}{b.residence?.by && <small>{b.residence.by}</small>}</td>
                  <td>{b.residence?.registered
                    ? <button className="ad-btn sm" onClick={() => mark(b, false)}>Bỏ đánh dấu</button>
                    : <button className="ad-btn sm primary" disabled={b.missingId || b.status !== 'checked_in'} title={b.status !== 'checked_in' ? 'Khai báo sau khi check-in' : ''} onClick={() => mark(b, true)}>Đã khai báo</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ResidenceTab;
