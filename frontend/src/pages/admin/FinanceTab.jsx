import React, { useCallback, useEffect, useState } from 'react';
import api from '../../utils/api';
import InvoiceModal from './InvoiceModal';
import { BarList } from './charts';
import { Field, Modal, Stat, METHODS, errMsg, vnd, dmy, ymd } from './ui';

const CATEGORIES = ['Lương', 'Điện nước', 'Vật tư', 'Marketing', 'Bảo trì', 'Khác'];

const FinanceTab = ({ notify, can }) => {
  const [month, setMonth] = useState(() => ymd(new Date()).slice(0, 7));
  const [d, setD] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [adding, setAdding] = useState(false);
  const [exp, setExp] = useState({ title: '', category: 'Khác', amount: '', date: ymd(new Date()), note: '' });

  const load = useCallback(() => api.get('/admin/finance', { params: { month } }).then((r) => setD(r.data)).catch((e) => notify(errMsg(e), true)), [month, notify]);
  useEffect(() => { load(); }, [load]);

  const addExpense = async (e) => {
    e.preventDefault();
    try { await api.post('/admin/expenses', exp); setAdding(false); notify('Đã thêm khoản chi.'); load(); } catch (err) { notify(errMsg(err), true); }
  };
  const delExpense = async (id) => {
    if (!window.confirm('Xóa khoản chi này?')) return;
    try { await api.delete(`/admin/expenses/${id}`); load(); } catch (err) { notify(errMsg(err), true); }
  };

  if (!d) return <div className="ad-empty">Đang tải...</div>;
  const [y, m] = d.month.split('-');
  const row = (label, value) => <div className="ad-row"><span>{label}</span><span>{vnd(value)}</span></div>;

  return (
    <>
      <div className="ad-toolbar">
        <input className="ad-input" type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
        <span className="grow" />
        {can('expenses.edit') && <button className="ad-btn primary" onClick={() => setAdding(true)}>+ Thêm khoản chi</button>}
      </div>

      <div className="ad-grid c4">
        <Stat label="Tổng doanh thu" value={vnd(d.totalRevenue)} />
        <Stat label="Đã thu (ròng)" value={vnd(d.received - d.refunded)} tone="green" sub={`Hoàn tiền: ${vnd(d.refunded)}`} />
        <Stat label="Chưa thanh toán" value={vnd(d.outstanding)} tone="orange" />
        <Stat label="Lợi nhuận (sau chi phí)" value={vnd(d.profit)} tone={d.profit >= 0 ? 'blue' : 'red'} sub={`Chi phí: ${vnd(d.totalExpenses)}`} />
      </div>

      <div className="ad-grid c2">
        <div className="ad-card">
          <h3>DOANH THU THÁNG {m}/{y}</h3>
          <div className="ad-report">
            {row('Phòng', d.roomRevenue)}
            {row('Dịch vụ', d.serviceRevenue)}
            {row('Ăn uống', d.foodRevenue)}
            <div className="ad-row total"><span>TỔNG</span><span>{vnd(d.totalRevenue)}</span></div>
            {row('Chi phí', -d.totalExpenses)}
            <div className="ad-row total"><span>LỢI NHUẬN</span><span>{vnd(d.profit)}</span></div>
            <p className="ad-hint" style={{ fontFamily: 'inherit' }}>Doanh thu chưa gồm VAT và phí phục vụ. Trên hóa đơn đã trả phòng trong tháng: VAT {vnd(d.taxes.vat)} · phí phục vụ {vnd(d.taxes.service)}.</p>
          </div>
        </div>
        <div className="ad-card">
          <h3>Phương thức thanh toán <small>đã thu trong tháng</small></h3>
          <BarList rows={d.byMethod.map((x) => ({ label: METHODS[x.method] || x.method, value: x.amount }))} format={vnd} />
        </div>
      </div>

      <div className="ad-card">
        <h3>Chi phí trong tháng</h3>
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead><tr><th>Ngày</th><th>Khoản chi</th><th>Danh mục</th><th className="num">Số tiền</th><th /></tr></thead>
            <tbody>
              {d.expenses.length === 0 && <tr><td colSpan="5" className="ad-empty">Chưa có khoản chi</td></tr>}
              {d.expenses.map((e) => (
                <tr key={e._id}><td>{dmy(e.date)}</td><td>{e.title}{e.note && e.note !== 'demo' && <small>{e.note}</small>}</td><td>{e.category}</td><td className="num">{vnd(e.amount)}</td><td>{can('expenses.edit') && <button className="ad-btn sm danger" onClick={() => delExpense(e._id)}>Xóa</button>}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ad-card">
        <h3>Hóa đơn <small>đơn đã trả phòng trong tháng</small></h3>
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead><tr><th>Mã</th><th>Khách</th><th>Phòng</th><th>Trả phòng</th><th className="num">Tiền hàng</th><th className="num">Phí PV + VAT</th><th className="num">Tổng</th><th className="num">Đã thu</th><th className="num">Còn lại</th></tr></thead>
            <tbody>
              {d.invoices.length === 0 && <tr><td colSpan="9" className="ad-empty">Chưa có hóa đơn</td></tr>}
              {d.invoices.map((i) => (
                <tr key={i._id} className="click" onClick={() => setInvoice(i._id)}>
                  <td><strong>{i.bookingCode}</strong></td><td>{i.guest}</td><td>{i.room}</td><td>{dmy(i.checkOut)}</td>
                  <td className="num">{vnd(i.net)}</td><td className="num">{vnd(i.service + i.vat)}</td><td className="num">{vnd(i.total)}</td><td className="num">{vnd(i.paid)}</td><td className="num">{vnd(i.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {invoice && <InvoiceModal bookingId={invoice} onClose={() => setInvoice(null)} />}
      {adding && (
        <Modal title="Thêm khoản chi" onClose={() => setAdding(false)}>
          <form className="ad-form-grid" onSubmit={addExpense}>
            <Field label="Nội dung" full><input className="ad-input" required value={exp.title} onChange={(e) => setExp({ ...exp, title: e.target.value })} /></Field>
            <Field label="Danh mục"><select className="ad-select" value={exp.category} onChange={(e) => setExp({ ...exp, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Số tiền (đ)"><input className="ad-input" type="number" min="0" required value={exp.amount} onChange={(e) => setExp({ ...exp, amount: e.target.value })} /></Field>
            <Field label="Ngày"><input className="ad-input" type="date" value={exp.date} onChange={(e) => setExp({ ...exp, date: e.target.value })} /></Field>
            <Field label="Ghi chú"><input className="ad-input" value={exp.note} onChange={(e) => setExp({ ...exp, note: e.target.value })} /></Field>
            <div className="full"><button className="ad-btn primary" type="submit">Lưu</button></div>
          </form>
        </Modal>
      )}
    </>
  );
};

export default FinanceTab;
