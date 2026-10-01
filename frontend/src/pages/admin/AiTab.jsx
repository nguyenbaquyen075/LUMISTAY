import React, { useEffect, useRef, useState } from 'react';
import api from '../../utils/api';
import { ForecastBars } from './charts';
import { Badge, errMsg, vnd, vndShort } from './ui';

const SUGGESTIONS = [
  'Tháng này phòng nào có doanh thu cao nhất?',
  'So sánh doanh thu tháng này với tháng trước',
  'Loại phòng nào đang giảm doanh thu?',
  'Tối đa 3 việc nên làm để tăng công suất tuần tới?'
];
const TONE = { 'Khách có giá trị cao': 'gold', 'Khách thường xuyên': 'green', 'Khách có nguy cơ không quay lại': 'red', 'Khách mới': 'blue', 'Khách thường': 'gray' };

const AiTab = ({ notify }) => {
  const [o, setO] = useState(null);
  const [chat, setChat] = useState([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { api.get('/admin/ai/overview').then((r) => setO(r.data)).catch((e) => notify(errMsg(e), true)); }, [notify]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }); }, [chat, busy]);

  const ask = async (text) => {
    const question = (text ?? q).trim();
    if (!question || busy) return;
    setQ('');
    setChat((c) => [...c, { who: 'user', text: question }]);
    setBusy(true);
    try {
      const r = await api.post('/admin/ai/ask', { question }, { timeout: 90000 });
      setChat((c) => [...c, { who: 'bot', text: r.data.answer }]);
    } catch (e) {
      setChat((c) => [...c, { who: 'bot', text: '⚠️ ' + errMsg(e) }]);
    } finally { setBusy(false); }
  };

  if (!o) return <div className="ad-empty">Đang tải...</div>;
  return (
    <>
      <div className="ad-grid c2-1">
        <div className="ad-card">
          <h3>AI dự báo công suất <small>7 ngày tới · cột đậm = đã đặt, cột nhạt = dự báo</small></h3>
          <ForecastBars days={o.forecast.days} />
          <p className="ad-hint" style={{ marginTop: 10 }}>Dựa trên đơn đã đặt + mức công suất trung bình theo thứ trong 8 tuần gần nhất, điều chỉnh theo xu hướng 4 tuần. ⚠️ = dự kiến ≥ 90%.</p>
        </div>
        <div className="ad-card">
          <h3>AI dự báo doanh thu</h3>
          <div style={{ fontSize: 26, fontWeight: 700 }}>≈ {vndShort(o.forecast.month.expected)}</div>
          <p className="ad-hint">Doanh thu dự kiến tháng này</p>
          <ul className="ad-list">
            <li><span>Đã ghi nhận</span><span>{vnd(o.forecast.month.actual)}</span></li>
            <li><span>Dự kiến còn lại</span><span>{vnd(o.forecast.month.projected)}</span></li>
            <li><span>Giá phòng TB / đêm</span><span>{vnd(o.forecast.adr)}</span></li>
          </ul>
        </div>
      </div>

      <div className="ad-card">
        <h3>AI phát hiện bất thường</h3>
        {o.anomalies.map((a, i) => <div key={i} className={`ad-alert ${a.level}`}>{a.message}</div>)}
      </div>

      <div className="ad-card">
        <h3>AI phân tích khách hàng <small>{o.segments.total} khách</small></h3>
        <div className="ad-grid c3">
          {o.segments.segments.map((s) => (
            <div key={s.key} className="ad-card" style={{ background: '#faf8f3', boxShadow: 'none' }}>
              <h3><Badge tone={TONE[s.label]}>{s.label}</Badge> <small>{s.count} khách</small></h3>
              {s.top.length === 0 ? <div className="ad-hint">—</div> : (
                <ul className="ad-list">{s.top.map((t) => <li key={t.email}><span>{t.name}</span><span className="ad-hint">{t.bookings} lần · {vndShort(t.spent)}</span></li>)}</ul>
              )}
            </div>
          ))}
        </div>
        <p className="ad-hint">Quy tắc: giá trị cao = top 20% chi tiêu · thường xuyên = ≥ 3 lần · nguy cơ = ≥ 2 lần nhưng &gt; 120 ngày chưa quay lại · mới = 1 lần đặt trong 60 ngày.</p>
      </div>

      <div className="ad-card">
        <h3>Trợ lý AI cho Admin</h3>
        <div className="ad-chips">{SUGGESTIONS.map((s) => <button key={s} className="ad-chip" onClick={() => ask(s)}>{s}</button>)}</div>
        {chat.length > 0 && (
          <div className="ad-chat">
            {chat.map((m, i) => <div key={i} className={`ad-msg ${m.who}`}>{m.text}</div>)}
            {busy && <div className="ad-msg bot">Đang phân tích dữ liệu...</div>}
            <div ref={endRef} />
          </div>
        )}
        <form className="ad-actions" onSubmit={(e) => { e.preventDefault(); ask(); }}>
          <input className="ad-input" style={{ flex: 1 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Hỏi về doanh thu, công suất, khách hàng..." maxLength={1000} />
          <button className="ad-btn primary" disabled={busy || !q.trim()}>Gửi</button>
        </form>
      </div>
    </>
  );
};

export default AiTab;
