import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Field, SOURCES, errMsg } from './ui';

const SettingsTab = ({ notify, can }) => {
  const [s, setS] = useState(null);
  const edit = can('settings.edit');

  useEffect(() => { api.get('/config/settings').then((r) => setS(r.data.settings)).catch((e) => notify(errMsg(e), true)); }, [notify]);
  if (!s) return <div className="ad-empty">Đang tải...</div>;

  const set = (k) => (e) => setS({ ...s, [k]: e.target.value });
  const setBank = (k) => (e) => setS({ ...s, bank: { ...s.bank, [k]: e.target.value } });
  const setComm = (k) => (e) => setS({ ...s, commissions: { ...s.commissions, [k]: e.target.value } });

  const save = async (e) => {
    e.preventDefault();
    const body = { ...s };
    delete body.seasons; // managed in "Giá & hạng phòng"
    body.commissions = Object.fromEntries(Object.entries(s.commissions).map(([k, v]) => [k, +v || 0]));
    try { const r = await api.put('/config/settings', body); setS(r.data.settings); notify('Đã lưu cấu hình.'); } catch (err) { notify(errMsg(err), true); }
  };

  return (
    <form onSubmit={save}>
      <fieldset disabled={!edit} style={{ border: 0, padding: 0, margin: 0 }}>
        <div className="ad-card">
          <h3>Thông tin khách sạn (in trên hóa đơn)</h3>
          <div className="ad-form-grid">
            <Field label="Tên khách sạn"><input className="ad-input" value={s.name} onChange={set('name')} /></Field>
            <Field label="Mã số thuế"><input className="ad-input" value={s.taxCode} onChange={set('taxCode')} /></Field>
            <Field label="Địa chỉ" full><input className="ad-input" value={s.address} onChange={set('address')} /></Field>
            <Field label="Điện thoại"><input className="ad-input" value={s.phone} onChange={set('phone')} /></Field>
            <Field label="Email"><input className="ad-input" value={s.email} onChange={set('email')} /></Field>
          </div>
        </div>

        <div className="ad-grid c2">
          <div className="ad-card">
            <h3>Giờ & thuế phí</h3>
            <div className="ad-form-grid">
              <Field label="Giờ nhận phòng"><input className="ad-input" type="time" value={s.checkInTime} onChange={set('checkInTime')} /></Field>
              <Field label="Giờ trả phòng"><input className="ad-input" type="time" value={s.checkOutTime} onChange={set('checkOutTime')} /></Field>
              <Field label="VAT (%)"><input className="ad-input" type="number" min="0" max="100" value={s.vatRate} onChange={set('vatRate')} /></Field>
              <Field label="Phí phục vụ (%)"><input className="ad-input" type="number" min="0" max="100" value={s.serviceChargeRate} onChange={set('serviceChargeRate')} /></Field>
              <Field label="Phụ thu nhận phòng sớm (% giá 1 đêm)"><input className="ad-input" type="number" min="0" max="100" value={s.earlyCheckInFeePercent} onChange={set('earlyCheckInFeePercent')} /></Field>
              <Field label="Phụ thu trả phòng muộn (% giá 1 đêm)"><input className="ad-input" type="number" min="0" max="100" value={s.lateCheckOutFeePercent} onChange={set('lateCheckOutFeePercent')} /></Field>
            </div>
            <p className="ad-hint">Giá phòng niêm yết chưa gồm phí phục vụ và VAT. Thuế/phí được chốt theo mức hiện hành tại thời điểm đặt phòng. Hãy xác nhận mức VAT áp dụng với kế toán.</p>
          </div>
          <div className="ad-card">
            <h3>Hoa hồng theo nguồn đặt (%)</h3>
            <div className="ad-form-grid">
              {Object.entries(SOURCES).filter(([k]) => !['website', 'walk_in', 'phone'].includes(k)).map(([k, v]) => (
                <Field key={k} label={v}><input className="ad-input" type="number" min="0" max="100" value={s.commissions[k] ?? 0} onChange={setComm(k)} /></Field>
              ))}
            </div>
            <p className="ad-hint">Dùng để ước tính hoa hồng OTA trong báo cáo (chưa đồng bộ trực tiếp với OTA).</p>
          </div>
        </div>

        <div className="ad-card">
          <h3>Tài khoản nhận chuyển khoản (mã VietQR trên hóa đơn)</h3>
          <div className="ad-form-grid">
            <Field label="Mã ngân hàng (VCB, MB, TCB...)"><input className="ad-input" value={s.bank.bankCode} onChange={setBank('bankCode')} /></Field>
            <Field label="Số tài khoản"><input className="ad-input" value={s.bank.accountNo} onChange={setBank('accountNo')} /></Field>
            <Field label="Tên chủ tài khoản" full><input className="ad-input" value={s.bank.accountName} onChange={setBank('accountName')} /></Field>
          </div>
        </div>
      </fieldset>
      {edit ? <button className="ad-btn primary" type="submit">Lưu cấu hình</button> : <p className="ad-hint">Bạn chỉ có quyền xem cấu hình.</p>}
    </form>
  );
};

export default SettingsTab;
