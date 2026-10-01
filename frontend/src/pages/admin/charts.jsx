import React from 'react';
import { vndShort } from './ui';

// Line/area chart in plain SVG. data: [{ x: label, y: number }]
export const LineChart = ({ data, format = vndShort, color = '#0d6efd', height = 180 }) => {
  if (!data.length) return <div className="ad-empty">Chưa có dữ liệu</div>;
  const W = 640;
  const H = height;
  const pad = { l: 52, r: 10, t: 10, b: 22 };
  const max = Math.max(...data.map((d) => d.y), 1);
  const sx = (i) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(1, data.length - 1);
  const sy = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const pts = data.map((d, i) => `${sx(i)},${sy(d.y)}`).join(' ');
  const ticks = [0, 0.5, 1];
  const labelIdx = [0, Math.floor((data.length - 1) / 2), data.length - 1];
  return (
    <div className="ad-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={sy(max * t)} y2={sy(max * t)} stroke="#eee" />
            <text x={pad.l - 6} y={sy(max * t) + 4} textAnchor="end" fontSize="10" fill="#6b7280">{format(max * t)}</text>
          </g>
        ))}
        <polygon points={`${sx(0)},${sy(0)} ${pts} ${sx(data.length - 1)},${sy(0)}`} fill={color} opacity="0.12" />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        {labelIdx.map((i) => (
          <text key={i} x={sx(i)} y={H - 5} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'} fontSize="10" fill="#6b7280">{data[i].x}</text>
        ))}
        {data.map((d, i) => (
          <circle key={i} cx={sx(i)} cy={sy(d.y)} r="6" fill="transparent"><title>{`${d.x}: ${format(d.y)}`}</title></circle>
        ))}
      </svg>
    </div>
  );
};

// Horizontal bars. rows: [{ label, value }]
export const BarList = ({ rows, format = vndShort }) => {
  if (!rows.length) return <div className="ad-empty">Chưa có dữ liệu</div>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="ad-bars">
      {rows.map((r) => (
        <div className="ad-bar-row" key={r.label}>
          <span>{r.label}</span>
          <div className="ad-bar-track"><div className="ad-bar-fill" style={{ width: `${(r.value / max) * 100}%` }} /></div>
          <strong style={{ textAlign: 'right' }}>{format(r.value)}</strong>
        </div>
      ))}
    </div>
  );
};

// 7-day occupancy forecast: solid = already booked, tinted = AI prediction
export const ForecastBars = ({ days }) => (
  <div className="ad-forecast">
    {days.map((d) => (
      <div key={d.date} className={`ad-fc-day ${d.high ? 'high' : ''}`}>
        <strong>{Math.round(d.predicted * 100)}%{d.high ? ' ⚠️' : ''}</strong>
        <div className="ad-fc-col" title={`Đã đặt ${Math.round(d.onBooks * 100)}% · dự báo ${Math.round(d.predicted * 100)}%`}>
          <div className="ad-fc-pred" style={{ height: `${d.predicted * 100}%` }} />
          <div className="ad-fc-book" style={{ height: `${d.onBooks * 100}%` }} />
        </div>
        <div>{d.weekday}</div>
        <small>{d.date.slice(8)}/{d.date.slice(5, 7)}</small>
      </div>
    ))}
  </div>
);
