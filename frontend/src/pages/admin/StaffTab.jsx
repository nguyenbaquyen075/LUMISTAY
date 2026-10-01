import React, { useCallback, useEffect, useState } from 'react';
import api from '../../utils/api';
import { Badge, Field, Modal, ROLES, errMsg, dmy } from './ui';

const PERMS = [
  ['Super Admin', 'Toàn hệ thống, quản lý nhân viên và phân quyền'],
  ['Quản lý', 'Vận hành + báo cáo: dashboard, giá phòng, tài chính, chốt ngày, AI, cấu hình, nhật ký; giảm giá tới 30%, hủy phí, hoàn tiền, đổi trạng thái phòng'],
  ['Lễ tân', 'Đặt phòng, check-in/out, thu tiền, giảm giá tới 10%, khách hàng, khai báo lưu trú, ca thu ngân; không hoàn tiền / hủy phí / xem tài chính'],
  ['Buồng phòng', 'Xem sơ đồ phòng, cập nhật trạng thái dọn phòng'],
  ['Thu ngân', 'Thêm phí, thu tiền, ca thu ngân; xem đặt phòng và khách'],
  ['Kế toán', 'Tài chính, chi phí, báo cáo, nhật ký, hoàn tiền; xem đặt phòng và khách'],
  ['Sales', 'Tạo và xem đặt phòng, giá phòng, khách hàng, báo cáo; giảm giá tới 10%']
];

const StaffTab = ({ me, notify }) => {
  const [staff, setStaff] = useState([]);
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ name: '', email: '', password: '', phone: '', role: 'receptionist' });

  const load = useCallback(() => api.get('/admin/staff').then((r) => setStaff(r.data.staff)).catch((e) => notify(errMsg(e), true)), [notify]);
  useEffect(() => { load(); }, [load]);

  const update = async (id, patch) => {
    try { await api.put(`/admin/staff/${id}`, patch); notify('Đã cập nhật.'); load(); } catch (e) { notify(errMsg(e), true); }
  };
  const create = async (e) => {
    e.preventDefault();
    try { await api.post('/admin/staff', f); setAdding(false); setF({ name: '', email: '', password: '', phone: '', role: 'receptionist' }); notify('Đã tạo tài khoản.'); load(); } catch (err) { notify(errMsg(err), true); }
  };

  return (
    <>
      <div className="ad-toolbar"><span className="grow" /><button className="ad-btn primary" onClick={() => setAdding(true)}>+ Thêm nhân viên</button></div>
      <div className="ad-card">
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead><tr><th>Nhân viên</th><th>Vai trò</th><th>Trạng thái</th><th>Tạo lúc</th><th /></tr></thead>
            <tbody>
              {staff.map((s) => {
                const self = s._id === me.id || s._id === me._id;
                return (
                  <tr key={s._id}>
                    <td>{s.name}<small>{s.email}{s.phone ? ` · ${s.phone}` : ''}</small></td>
                    <td>
                      <select className="ad-select" style={{ width: 150 }} value={s.role} disabled={self} onChange={(e) => update(s._id, { role: e.target.value })}>
                        {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </td>
                    <td>{s.isActive ? <Badge tone="green">Hoạt động</Badge> : <Badge tone="gray">Vô hiệu hóa</Badge>}</td>
                    <td>{dmy(s.createdAt)}</td>
                    <td>{!self && <button className="ad-btn sm" onClick={() => update(s._id, { isActive: !s.isActive })}>{s.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="ad-card">
        <h3>Phân quyền</h3>
        <ul className="ad-list">{PERMS.map(([r, d]) => <li key={r}><strong>{r}</strong><span>{d}</span></li>)}</ul>
      </div>
      {adding && (
        <Modal title="Thêm nhân viên" onClose={() => setAdding(false)}>
          <form className="ad-form-grid" onSubmit={create}>
            <Field label="Họ tên"><input className="ad-input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="SĐT"><input className="ad-input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
            <Field label="Email đăng nhập"><input className="ad-input" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
            <Field label="Mật khẩu (≥ 6 ký tự)"><input className="ad-input" type="password" minLength={6} required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
            <Field label="Vai trò" full><select className="ad-select" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <div className="full"><button className="ad-btn primary" type="submit">Tạo tài khoản</button></div>
          </form>
        </Modal>
      )}
    </>
  );
};

export default StaffTab;
