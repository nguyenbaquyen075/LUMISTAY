import React, { useCallback, useEffect, useState } from 'react';
import api from '../../utils/api';
import { Badge, Field, Modal, errMsg, vnd } from './ui';

const TypeForm = ({ item, onClose, onSaved, notify }) => {
  const [f, setF] = useState(item || { name: '', description: '', basePrice: '', baseAdults: 2, maxAdults: 2, maxChildren: 1, freeChildren: 1, extraAdultFee: 0, childFee: 0 });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault();
    const body = { ...f };
    for (const k of ['basePrice', 'baseAdults', 'maxAdults', 'maxChildren', 'freeChildren', 'extraAdultFee', 'childFee']) body[k] = +body[k];
    try {
      if (item) await api.put(`/config/room-types/${item._id}`, body); else await api.post('/config/room-types', body);
      notify('Đã lưu hạng phòng.'); onSaved();
    } catch (err) { notify(errMsg(err), true); }
  };
  return (
    <Modal title={item ? `Sửa hạng ${item.name}` : 'Thêm hạng phòng'} onClose={onClose}>
      <form className="ad-form-grid" onSubmit={save}>
        <Field label="Tên hạng phòng"><input className="ad-input" required disabled={!!item} value={f.name} onChange={set('name')} /></Field>
        <Field label="Giá gốc / đêm (đ)"><input className="ad-input" type="number" min="0" required value={f.basePrice} onChange={set('basePrice')} /></Field>
        <Field label="Mô tả" full><input className="ad-input" value={f.description} onChange={set('description')} /></Field>
        <Field label="Người lớn đã gồm trong giá"><input className="ad-input" type="number" min="1" value={f.baseAdults} onChange={set('baseAdults')} /></Field>
        <Field label="Tối đa người lớn"><input className="ad-input" type="number" min="1" value={f.maxAdults} onChange={set('maxAdults')} /></Field>
        <Field label="Tối đa trẻ em"><input className="ad-input" type="number" min="0" value={f.maxChildren} onChange={set('maxChildren')} /></Field>
        <Field label="Trẻ em miễn phí"><input className="ad-input" type="number" min="0" value={f.freeChildren} onChange={set('freeChildren')} /></Field>
        <Field label="Phụ thu người lớn thêm / đêm"><input className="ad-input" type="number" min="0" value={f.extraAdultFee} onChange={set('extraAdultFee')} /></Field>
        <Field label="Phí trẻ em (ngoài miễn phí) / đêm"><input className="ad-input" type="number" min="0" value={f.childFee} onChange={set('childFee')} /></Field>
        <div className="full"><button className="ad-btn primary" type="submit">Lưu</button></div>
      </form>
    </Modal>
  );
};

const PlanForm = ({ item, types, onClose, onSaved, notify }) => {
  const [f, setF] = useState(item || { code: '', name: '', description: '', adjustPercent: 0, breakfast: false, nonRefundable: false, freeCancelHours: 48, penaltyNights: 1, depositPercent: 0, minStay: 1, isPublic: true, isDefault: false, active: true, roomTypes: [] });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const toggleType = (name) => setF({ ...f, roomTypes: f.roomTypes.includes(name) ? f.roomTypes.filter((x) => x !== name) : [...f.roomTypes, name] });
  const save = async (e) => {
    e.preventDefault();
    const body = { ...f };
    for (const k of ['adjustPercent', 'freeCancelHours', 'penaltyNights', 'depositPercent', 'minStay']) body[k] = +body[k];
    try {
      if (item) await api.put(`/config/rate-plans/${item._id}`, body); else await api.post('/config/rate-plans', body);
      notify('Đã lưu gói giá.'); onSaved();
    } catch (err) { notify(errMsg(err), true); }
  };
  return (
    <Modal title={item ? `Sửa gói ${item.code}` : 'Thêm gói giá'} onClose={onClose}>
      <form className="ad-form-grid" onSubmit={save}>
        <Field label="Mã gói"><input className="ad-input" required value={f.code} onChange={set('code')} placeholder="BAR" /></Field>
        <Field label="Tên gói"><input className="ad-input" required value={f.name} onChange={set('name')} /></Field>
        <Field label="Mô tả" full><input className="ad-input" value={f.description} onChange={set('description')} /></Field>
        <Field label="Điều chỉnh giá (%, âm = rẻ hơn)"><input className="ad-input" type="number" value={f.adjustPercent} onChange={set('adjustPercent')} /></Field>
        <Field label="Tối thiểu số đêm"><input className="ad-input" type="number" min="1" value={f.minStay} onChange={set('minStay')} /></Field>
        <Field label="Hủy miễn phí trước (giờ)"><input className="ad-input" type="number" min="0" value={f.freeCancelHours} onChange={set('freeCancelHours')} disabled={f.nonRefundable} /></Field>
        <Field label="Phí hủy muộn (số đêm)"><input className="ad-input" type="number" min="0" value={f.penaltyNights} onChange={set('penaltyNights')} disabled={f.nonRefundable} /></Field>
        <Field label="Đặt cọc yêu cầu (%)"><input className="ad-input" type="number" min="0" max="100" value={f.depositPercent} onChange={set('depositPercent')} /></Field>
        <div />
        <label><input type="checkbox" checked={f.nonRefundable} onChange={set('nonRefundable')} /> Không hoàn hủy</label>
        <label><input type="checkbox" checked={f.breakfast} onChange={set('breakfast')} /> Kèm bữa sáng</label>
        <label><input type="checkbox" checked={f.isPublic} onChange={set('isPublic')} /> Hiển thị cho khách (bỏ chọn = chỉ nội bộ)</label>
        <label><input type="checkbox" checked={f.active} onChange={set('active')} /> Đang áp dụng</label>
        <label><input type="checkbox" checked={f.isDefault} onChange={set('isDefault')} /> Gói mặc định (khách đặt online)</label>
        <div className="full"><span className="ad-hint">Áp dụng cho hạng phòng (không chọn = tất cả): </span>
          {types.map((t) => <label key={t._id} style={{ marginRight: 12 }}><input type="checkbox" checked={f.roomTypes.includes(t.name)} onChange={() => toggleType(t.name)} /> {t.name}</label>)}
        </div>
        <div className="full"><button className="ad-btn primary" type="submit">Lưu</button></div>
      </form>
    </Modal>
  );
};

const PricingTab = ({ notify, can }) => {
  const [types, setTypes] = useState([]);
  const [plans, setPlans] = useState([]);
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState(null); // {kind:'type'|'plan', item}
  const [season, setSeason] = useState({ name: '', from: '', to: '', adjustPercent: 20 });
  const edit = can('rates.edit');

  const load = useCallback(() => {
    api.get('/config/room-types').then((r) => setTypes(r.data.roomTypes)).catch((e) => notify(errMsg(e), true));
    api.get('/config/rate-plans').then((r) => setPlans(r.data.ratePlans)).catch(() => {});
    api.get('/config/settings').then((r) => setSettings(r.data.settings)).catch(() => {});
  }, [notify]);
  useEffect(() => { load(); }, [load]);

  const del = async (path, label) => {
    if (!window.confirm(`Xóa ${label}?`)) return;
    try { await api.delete(path); load(); } catch (e) { notify(errMsg(e), true); }
  };
  const saveSettings = async (patch) => {
    try { const r = await api.put('/config/settings', patch); setSettings(r.data.settings); notify('Đã lưu.'); } catch (e) { notify(errMsg(e), true); }
  };
  const canSettings = can('settings.edit');

  return (
    <>
      <div className="ad-card">
        <h3>Hạng phòng & giá gốc {edit && <button className="ad-btn sm primary" style={{ float: 'right' }} onClick={() => setForm({ kind: 'type' })}>+ Thêm hạng</button>}</h3>
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead><tr><th>Hạng phòng</th><th>Số phòng</th><th>Giá gốc / đêm</th><th>Sức chứa</th><th>Phụ thu NL thêm</th><th>Phí trẻ em</th><th /></tr></thead>
            <tbody>
              {types.map((t) => (
                <tr key={t._id}>
                  <td><strong>{t.name}</strong><small>{t.description}</small></td>
                  <td className="num">{t.rooms}</td>
                  <td className="num">{vnd(t.basePrice)}</td>
                  <td>{t.baseAdults} NL gồm sẵn · tối đa {t.maxAdults} NL + {t.maxChildren} TE</td>
                  <td className="num">{vnd(t.extraAdultFee)}</td>
                  <td className="num">{vnd(t.childFee)} <small>({t.freeChildren} TE miễn phí)</small></td>
                  <td>{edit && <div className="ad-actions"><button className="ad-btn sm" onClick={() => setForm({ kind: 'type', item: t })}>Sửa</button><button className="ad-btn sm danger" onClick={() => del(`/config/room-types/${t._id}`, `hạng ${t.name}`)}>Xóa</button></div>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="ad-hint" style={{ marginTop: 8 }}>Giá mỗi đêm = giá gốc × (1 + mùa cao điểm) × (1 + phụ thu cuối tuần) × (1 + điều chỉnh gói giá) + phụ thu người thêm. Đổi giá gốc sẽ cập nhật giá hiển thị trên website.</p>
      </div>

      <div className="ad-card">
        <h3>Gói giá & chính sách hủy {edit && <button className="ad-btn sm primary" style={{ float: 'right' }} onClick={() => setForm({ kind: 'plan' })}>+ Thêm gói</button>}</h3>
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead><tr><th>Gói</th><th>Giá</th><th>Chính sách hủy</th><th>Cọc</th><th>Tối thiểu</th><th>Hiển thị</th><th /></tr></thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p._id} style={{ opacity: p.active ? 1 : 0.5 }}>
                  <td><strong>{p.code}</strong> {p.isDefault && <Badge tone="blue">Mặc định</Badge>} {p.breakfast && <Badge tone="green">Bữa sáng</Badge>}<small>{p.name}{p.description ? ` — ${p.description}` : ''}</small></td>
                  <td>{p.adjustPercent > 0 ? '+' : ''}{p.adjustPercent}%</td>
                  <td>{p.nonRefundable ? <Badge tone="red">Không hoàn hủy</Badge> : `Miễn phí trước ${p.freeCancelHours}h · muộn tính ${p.penaltyNights} đêm`}</td>
                  <td>{p.depositPercent}%</td>
                  <td>{p.minStay} đêm</td>
                  <td>{p.isPublic ? 'Khách + nội bộ' : 'Nội bộ'}{p.roomTypes.length ? <small>{p.roomTypes.join(', ')}</small> : null}</td>
                  <td>{edit && <div className="ad-actions"><button className="ad-btn sm" onClick={() => setForm({ kind: 'plan', item: p })}>Sửa</button>{!p.isDefault && <button className="ad-btn sm danger" onClick={() => del(`/config/rate-plans/${p._id}`, `gói ${p.code}`)}>Xóa</button>}</div>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {settings && (
        <div className="ad-card">
          <h3>Mùa cao điểm & phụ thu cuối tuần</h3>
          <div className="ad-toolbar">
            <Field label="Phụ thu đêm Thứ 6 & Thứ 7 (%)"><input className="ad-input" style={{ width: 120 }} type="number" min="0" max="100" disabled={!canSettings} defaultValue={settings.weekendSurchargePercent} onBlur={(e) => +e.target.value !== settings.weekendSurchargePercent && saveSettings({ weekendSurchargePercent: +e.target.value })} /></Field>
          </div>
          <table className="ad-table">
            <thead><tr><th>Mùa / dịp</th><th>Từ ngày</th><th>Đến ngày</th><th>Điều chỉnh giá</th><th /></tr></thead>
            <tbody>
              {settings.seasons.length === 0 && <tr><td colSpan="5" className="ad-empty">Chưa có mùa nào</td></tr>}
              {settings.seasons.map((s) => (
                <tr key={s._id}><td>{s.name}</td><td>{new Date(s.from).toLocaleDateString('vi-VN')}</td><td>{new Date(s.to).toLocaleDateString('vi-VN')}</td><td>{s.adjustPercent > 0 ? '+' : ''}{s.adjustPercent}%</td>
                  <td>{canSettings && <button className="ad-btn sm danger" onClick={() => saveSettings({ seasons: settings.seasons.filter((x) => x._id !== s._id) })}>Xóa</button>}</td></tr>
              ))}
            </tbody>
          </table>
          {canSettings && (
            <div className="ad-toolbar" style={{ marginTop: 10 }}>
              <input className="ad-input" placeholder="Tên (Lễ 30/4, Tết...)" value={season.name} onChange={(e) => setSeason({ ...season, name: e.target.value })} />
              <input className="ad-input" type="date" value={season.from} onChange={(e) => setSeason({ ...season, from: e.target.value })} />
              <input className="ad-input" type="date" value={season.to} min={season.from} onChange={(e) => setSeason({ ...season, to: e.target.value })} />
              <input className="ad-input" style={{ width: 90 }} type="number" value={season.adjustPercent} onChange={(e) => setSeason({ ...season, adjustPercent: e.target.value })} />%
              <button className="ad-btn primary" disabled={!season.name || !season.from || !season.to} onClick={async () => { await saveSettings({ seasons: [...settings.seasons, season] }); setSeason({ name: '', from: '', to: '', adjustPercent: 20 }); }}>Thêm mùa</button>
            </div>
          )}
        </div>
      )}

      {form?.kind === 'type' && <TypeForm item={form.item} notify={notify} onClose={() => setForm(null)} onSaved={() => { setForm(null); load(); }} />}
      {form?.kind === 'plan' && <PlanForm item={form.item} types={types} notify={notify} onClose={() => setForm(null)} onSaved={() => { setForm(null); load(); }} />}
    </>
  );
};

export default PricingTab;
