import React, { useCallback, useEffect, useState } from 'react';
import api from '../../utils/api';
import { LineChart, BarList } from './charts';
import { Stat, SOURCES, errMsg, vnd, vndShort, pct, dmy, ymd } from './ui';

const csv = (name, head, rows) => {
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const blob = new Blob(['﻿' + [head, ...rows].map((r) => r.map(cell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
};

const DayLists = ({ notify }) => {
  const [date, setDate] = useState(ymd(new Date()));
  const [d, setD] = useState(null);
  useEffect(() => { api.get('/admin/day-lists', { params: { date } }).then((r) => setD(r.data)).catch((e) => notify(errMsg(e), true)); }, [date, notify]);
  const List = ({ title, rows }) => (
    <div className="ad-card">
      <h3>{title} <small>{rows?.length || 0}</small></h3>
      {!rows?.length ? <div className="ad-empty">Không có</div> : (
        <ul className="ad-list" style={{ maxHeight: 260, overflowY: 'auto' }}>
          {rows.map((b) => <li key={b._id}><span>{b.guest}<small className="ad-hint"> · {b.room || b.roomType} · {b.guests.adults + (b.guests.children || 0)} khách</small></span><span className="ad-hint">{dmy(b.checkIn)} → {dmy(b.checkOut)}</span></li>)}
        </ul>
      )}
    </div>
  );
  return (
    <>
      <div className="ad-toolbar"><strong>Danh sách theo ngày</strong><input className="ad-input" type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} /></div>
      {d && <div className="ad-grid c3"><List title="Khách đến" rows={d.arrivals} /><List title="Khách đi" rows={d.departures} /><List title="Đang ở / lưu trú trong ngày" rows={d.inHouse} /></div>}
    </>
  );
};

const ReportsTab = ({ notify }) => {
  const [range, setRange] = useState({ from: ymd(Date.now() - 29 * 864e5), to: ymd(new Date()) });
  const [r, setR] = useState(null);

  const load = useCallback(() => api.get('/admin/reports', { params: range }).then((x) => setR(x.data)).catch((e) => notify(errMsg(e), true)), [range, notify]);
  useEffect(() => { load(); }, [load]);

  const preset = (days) => setRange({ from: ymd(Date.now() - (days - 1) * 864e5), to: ymd(new Date()) });
  if (!r) return <div className="ad-empty">Đang tải...</div>;
  const s = r.summary;
  const dm = (x) => `${x.slice(8)}/${x.slice(5, 7)}`;

  return (
    <>
      <div className="ad-toolbar">
        <input className="ad-input" type="date" value={range.from} max={range.to} onChange={(e) => e.target.value && setRange({ ...range, from: e.target.value })} />
        <span>→</span>
        <input className="ad-input" type="date" value={range.to} min={range.from} onChange={(e) => e.target.value && setRange({ ...range, to: e.target.value })} />
        <div className="ad-tabs"><button onClick={() => preset(7)}>7 ngày</button><button onClick={() => preset(30)}>30 ngày</button><button onClick={() => preset(90)}>90 ngày</button></div>
        <span className="grow" />
        <button className="ad-btn" onClick={() => csv(`bao-cao-${r.from}-${r.to}.csv`, ['Ngày', 'Phòng bán', 'Công suất', 'ADR', 'RevPAR', 'Doanh thu phòng', 'Doanh thu khác', 'Tổng doanh thu'],
          r.daily.map((d) => [d.date, d.sold, pct(d.occupancy), Math.round(d.adr), Math.round(d.revpar), Math.round(d.roomRevenue), Math.round(d.otherRevenue), Math.round(d.revenue)]))}>Xuất CSV theo ngày</button>
      </div>

      <div className="ad-grid c4">
        <Stat label="Công suất (Occupancy)" value={pct(s.occupancy)} sub={`${s.sold} đêm bán / ${s.available} đêm có thể bán`} tone="blue" />
        <Stat label="ADR" value={vnd(s.adr)} sub="Doanh thu phòng / số đêm bán" />
        <Stat label="RevPAR" value={vnd(s.revpar)} sub="Occupancy × ADR" />
        <Stat label="TRevPAR" value={vnd(s.trevpar)} sub="Tổng doanh thu / phòng có thể bán" />
      </div>
      <div className="ad-grid c4">
        <Stat label="Doanh thu phòng" value={vndShort(s.roomRevenue)} />
        <Stat label="Dịch vụ + ăn uống + phí" value={vndShort(s.serviceRevenue + s.foodRevenue)} />
        <Stat label="Tổng doanh thu" value={vndShort(s.totalRevenue)} tone="green" />
        <Stat label="Số đặt phòng" value={r.stats.bookings} sub={`Hủy ${pct(r.stats.cancelRate)} · No-show ${pct(r.stats.noShowRate)}`} />
      </div>
      <div className="ad-grid c3">
        <Stat label="Thời gian đặt trước TB" value={`${r.stats.avgLeadDays.toFixed(1)} ngày`} />
        <Stat label="Số đêm ở TB" value={`${r.stats.avgLos.toFixed(1)} đêm`} />
        <Stat label="Hoa hồng OTA ước tính" value={vndShort(r.bySource.reduce((a, x) => a + x.commission, 0))} tone="orange" />
      </div>

      <div className="ad-grid c2">
        <div className="ad-card"><h3>Công suất theo ngày</h3><LineChart data={r.daily.map((d) => ({ x: dm(d.date), y: d.occupancy }))} format={pct} /></div>
        <div className="ad-card"><h3>RevPAR theo ngày</h3><LineChart data={r.daily.map((d) => ({ x: dm(d.date), y: d.revpar }))} /></div>
      </div>

      <div className="ad-grid c2">
        <div className="ad-card">
          <h3>Theo hạng phòng</h3>
          <table className="ad-table"><thead><tr><th>Hạng</th><th>Đêm bán</th><th>ADR</th><th>Doanh thu</th></tr></thead>
            <tbody>{r.byRoomType.map((t) => <tr key={t.type}><td>{t.type}</td><td className="num">{t.nights}</td><td className="num">{vnd(t.adr)}</td><td className="num">{vnd(t.revenue)}</td></tr>)}</tbody></table>
        </div>
        <div className="ad-card">
          <h3>Theo nguồn đặt <small>doanh thu thuần, hoa hồng ước tính</small></h3>
          <table className="ad-table"><thead><tr><th>Nguồn</th><th>Đơn</th><th>Doanh thu</th><th>Hoa hồng</th><th>Thực thu</th></tr></thead>
            <tbody>{r.bySource.map((x) => <tr key={x.key}><td>{SOURCES[x.key] || x.key}</td><td className="num">{x.bookings}</td><td className="num">{vnd(x.revenue)}</td><td className="num">{vnd(x.commission)}</td><td className="num">{vnd(x.revenue - x.commission)}</td></tr>)}</tbody></table>
        </div>
      </div>
      <div className="ad-card">
        <h3>Theo quốc tịch</h3>
        <BarList rows={r.byNationality.slice(0, 8).map((x) => ({ label: x.key, value: x.revenue }))} />
      </div>

      <DayLists notify={notify} />
    </>
  );
};

export default ReportsTab;
