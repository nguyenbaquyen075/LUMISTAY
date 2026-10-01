import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { LineChart, BarList, ForecastBars } from './charts';
import { Stat, ROOM_STATUS, vndShort, pct, errMsg, dmy, BookingBadge } from './ui';

const DashboardTab = ({ notify }) => {
  const [d, setD] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard').then((r) => setD(r.data)).catch((e) => notify(errMsg(e), true));
  }, [notify]);

  if (!d) return <div className="ad-empty">Đang tải...</div>;
  const dm = (s) => `${s.slice(8)}/${s.slice(5, 7)}`;

  return (
    <>
      <div className="ad-grid c4">
        <Stat label="Doanh thu hôm nay" value={vndShort(d.revenue.today)} />
        <Stat label="Doanh thu tuần này" value={vndShort(d.revenue.week)} />
        <Stat label="Doanh thu tháng này" value={vndShort(d.revenue.month)} />
        <Stat label="Tỷ lệ lấp đầy tối nay" value={pct(d.occupancyRate)} tone="blue" sub={`${d.rooms.occupied} đang ở / ${d.rooms.total} phòng`} />
      </div>

      <div className="ad-grid c3">
        <Stat label="Công suất · hôm nay / tháng" value={`${pct(d.kpi.today.occupancy)} / ${pct(d.kpi.month.occupancy)}`} />
        <Stat label="ADR · hôm nay / tháng" value={`${vndShort(d.kpi.today.adr)} / ${vndShort(d.kpi.month.adr)}`} sub="Giá phòng trung bình mỗi đêm bán" />
        <Stat label="RevPAR · hôm nay / tháng" value={`${vndShort(d.kpi.today.revpar)} / ${vndShort(d.kpi.month.revpar)}`} sub="Doanh thu phòng trên mỗi phòng có thể bán" />
      </div>

      <div className="ad-grid c6">
        {Object.entries(ROOM_STATUS).map(([k, v]) => (
          <Stat key={k} label={`${v.emoji} ${v.label}`} value={d.rooms[k]} tone={{ available: 'green', reserved: 'blue', occupied: 'red', cleaning: 'yellow', maintenance: 'orange', locked: 'gray' }[k]} />
        ))}
      </div>

      <div className="ad-grid c3">
        <Stat label="Check-in hôm nay" value={d.arrivals.length} sub={d.unassignedArrivals ? `${d.unassignedArrivals} chưa gán phòng` : undefined} />
        <Stat label="Check-out hôm nay" value={d.departures.length} />
        <Stat label="Đặt phòng mới (24h)" value={d.newBookings} />
      </div>

      <div className="ad-grid c2">
        <div className="ad-card">
          <h3>Doanh thu 30 ngày</h3>
          <LineChart data={d.series.map((s) => ({ x: dm(s.date), y: s.revenue }))} />
        </div>
        <div className="ad-card">
          <h3>Công suất phòng 30 ngày</h3>
          <LineChart data={d.series.map((s) => ({ x: dm(s.date), y: s.occupancy }))} format={pct} color="#2563eb" />
        </div>
      </div>

      <div className="ad-grid c2">
        <div className="ad-card">
          <h3>Doanh thu theo loại phòng <small>30 ngày</small></h3>
          <BarList rows={d.revenueByType.map((r) => ({ label: r.type, value: r.value }))} />
        </div>
        <div className="ad-card">
          <h3>AI dự báo công suất 7 ngày tới</h3>
          <ForecastBars days={d.forecast.days} />
          <p className="ad-hint" style={{ marginTop: 10 }}>
            Doanh thu dự kiến tháng này: <strong>≈ {vndShort(d.forecast.month.expected)}</strong> (đã ghi nhận {vndShort(d.forecast.month.actual)})
          </p>
        </div>
      </div>

      {d.anomalies.length > 0 && (
        <div className="ad-card">
          <h3>AI phát hiện bất thường</h3>
          {d.anomalies.map((a, i) => <div key={i} className={`ad-alert ${a.level}`}>{a.message}</div>)}
        </div>
      )}

      <div className="ad-grid c2">
        {[['Khách đến hôm nay', d.arrivals, 'checkIn'], ['Khách đi hôm nay', d.departures, 'checkOut']].map(([title, list]) => (
          <div className="ad-card" key={title}>
            <h3>{title}</h3>
            {list.length === 0 ? <div className="ad-empty">Không có</div> : (
              <ul className="ad-list">
                {list.map((b) => (
                  <li key={b._id}>
                    <span>{b.guestInfo.name}<small className="ad-hint"> · {b.room?.roomNumber || b.room?.name || b.roomType} · {dmy(b.checkIn)} → {dmy(b.checkOut)}</small></span>
                    <BookingBadge status={b.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
      <p className="ad-hint">Doanh thu chưa gồm VAT và phí phục vụ: tiền phòng theo từng đêm lưu trú + phí dịch vụ/ăn uống theo ngày phát sinh + phí hủy/no-show. Đơn chờ xác nhận không tính. ADR = doanh thu phòng / số đêm bán; RevPAR = doanh thu phòng / số phòng có thể bán.</p>
    </>
  );
};

export default DashboardTab;
