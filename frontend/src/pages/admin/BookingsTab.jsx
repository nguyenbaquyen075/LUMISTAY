import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import api from '../../utils/api';
import InvoiceModal from './InvoiceModal';
import {
  BookingBadge, PayBadge, Badge, Field, Modal, METHODS, SOURCES, CHARGE_CATEGORIES, errMsg, vnd, dmy, ymd
} from './ui';

const roomLabel = (b) => (b.room ? `${b.room.roomNumber ? b.room.roomNumber + ' · ' : ''}${b.room.name}` : null);
const today = () => ymd(new Date());

// ───────────── Create booking (walk-in / phone / OTA) ─────────────
const CreateBooking = ({ rooms, onClose, onCreated, notify }) => {
  const [q, setQ] = useState({ checkIn: today(), checkOut: ymd(Date.now() + 864e5), adults: 2, children: 0 });
  const [types, setTypes] = useState(null);
  const [pick, setPick] = useState(null); // { type, plan }
  const [f, setF] = useState({ name: '', phone: '', email: '', idNumber: '', nationality: 'Việt Nam', source: 'walk_in', status: 'confirmed', roomId: '', depositAmount: '', depositMethod: 'cash', force: false });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const search = async (e) => {
    e?.preventDefault();
    try {
      const r = await api.get('/bookings/availability', { params: q });
      setTypes(r.data.types);
      setPick(null);
    } catch (err) { notify(errMsg(err), true); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!pick) return notify('Hãy chọn hạng phòng và gói giá.', true);
    try {
      await api.post('/bookings/admin/create', {
        roomType: pick.type.type.name, ratePlanId: pick.plan._id, roomId: f.roomId || undefined,
        checkIn: q.checkIn, checkOut: q.checkOut, status: f.status, source: f.source, force: f.force,
        guests: { adults: +q.adults, children: +q.children },
        guestInfo: { name: f.name, phone: f.phone, email: f.email, idNumber: f.idNumber, nationality: f.nationality },
        deposit: +f.depositAmount > 0 ? { amount: +f.depositAmount, method: f.depositMethod } : undefined
      });
      notify('Đã tạo đặt phòng.');
      onCreated();
    } catch (err) { notify(errMsg(err), true); }
  };

  const typeRooms = pick ? rooms.filter((r) => r.type === pick.type.type.name && r.status === 'available') : [];

  return (
    <Modal wide title="Tạo đặt phòng" onClose={onClose}>
      <form className="ad-toolbar" onSubmit={search}>
        <Field label="Nhận phòng"><input className="ad-input" type="date" value={q.checkIn} onChange={(e) => setQ({ ...q, checkIn: e.target.value })} required /></Field>
        <Field label="Trả phòng"><input className="ad-input" type="date" min={q.checkIn} value={q.checkOut} onChange={(e) => setQ({ ...q, checkOut: e.target.value })} required /></Field>
        <Field label="Người lớn"><input className="ad-input" style={{ width: 80 }} type="number" min="1" value={q.adults} onChange={(e) => setQ({ ...q, adults: e.target.value })} /></Field>
        <Field label="Trẻ em"><input className="ad-input" style={{ width: 80 }} type="number" min="0" value={q.children} onChange={(e) => setQ({ ...q, children: e.target.value })} /></Field>
        <button className="ad-btn primary" style={{ alignSelf: 'flex-end' }} type="submit">Tìm phòng trống</button>
      </form>

      {types && (
        <div className="ad-table-wrap ad-section">
          <table className="ad-table">
            <thead><tr><th>Hạng phòng</th><th>Còn trống</th><th>Gói giá (tổng {types[0]?.nights} đêm, chưa gồm thuế & phí)</th></tr></thead>
            <tbody>
              {types.map((t) => (
                <tr key={t.type._id}>
                  <td><strong>{t.type.name}</strong><small>Tối đa {t.type.maxAdults} NL + {t.type.maxChildren} TE · giá gốc {vnd(t.type.basePrice)}</small></td>
                  <td style={{ textAlign: 'center' }}>{t.free}/{t.total}{!t.fits && <small style={{ color: '#dc3545' }}>Vượt sức chứa</small>}</td>
                  <td>
                    {t.free < 1 || !t.fits ? <span className="ad-hint">Không thể đặt</span> : (
                      <div className="ad-actions">
                        {t.plans.map((p) => {
                          const on = pick?.type.type._id === t.type._id && pick.plan._id === p._id;
                          return (
                            <button type="button" key={p._id} disabled={!p.allowed} className={`ad-btn sm ${on ? 'primary' : ''}`} onClick={() => setPick({ type: t, plan: p })}
                              title={`${p.nonRefundable ? 'Không hoàn hủy' : `Hủy miễn phí trước ${p.freeCancelHours}h`}${p.breakfast ? ' · gồm bữa sáng' : ''}${p.minStay > 1 ? ` · tối thiểu ${p.minStay} đêm` : ''}`}>
                              {p.name}: {vnd(p.total)}{!p.isPublic && ' (nội bộ)'}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pick && (
        <form className="ad-form-grid" onSubmit={submit}>
          <div className="full ad-alert info">Đã chọn: <strong>{pick.type.type.name}</strong> · {pick.plan.name} · {vnd(pick.plan.total)} (chưa gồm thuế & phí). {pick.plan.depositPercent > 0 && `Gói này yêu cầu cọc ${pick.plan.depositPercent}%.`}</div>
          <Field label="Họ tên khách"><input className="ad-input" value={f.name} onChange={set('name')} required /></Field>
          <Field label="Số điện thoại"><input className="ad-input" value={f.phone} onChange={set('phone')} required /></Field>
          <Field label="Email"><input className="ad-input" type="email" value={f.email} onChange={set('email')} required /></Field>
          <Field label="CCCD / Hộ chiếu"><input className="ad-input" value={f.idNumber} onChange={set('idNumber')} /></Field>
          <Field label="Quốc tịch"><input className="ad-input" value={f.nationality} onChange={set('nationality')} /></Field>
          <Field label="Nguồn đặt">
            <select className="ad-select" value={f.source} onChange={set('source')}>{Object.entries(SOURCES).filter(([k]) => k !== 'website').map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </Field>
          <Field label="Gán phòng ngay (không bắt buộc)">
            <select className="ad-select" value={f.roomId} onChange={set('roomId')}>
              <option value="">Gán khi check-in</option>
              {typeRooms.map((r) => <option key={r._id} value={r._id}>{r.roomNumber || '—'} · tầng {r.floor}</option>)}
            </select>
          </Field>
          <Field label="Trạng thái">
            <select className="ad-select" value={f.status} onChange={set('status')}><option value="pending">Chờ xác nhận</option><option value="confirmed">Đã xác nhận</option></select>
          </Field>
          <Field label="Tiền cọc (đ)"><input className="ad-input" type="number" min="0" value={f.depositAmount} onChange={set('depositAmount')} /></Field>
          <Field label="Hình thức cọc">
            <select className="ad-select" value={f.depositMethod} onChange={set('depositMethod')}>{Object.entries(METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </Field>
          <label className="full"><input type="checkbox" checked={f.force} onChange={set('force')} /> Vẫn đặt nếu khách nằm trong danh sách đen (quản lý đồng ý)</label>
          <div className="full ad-actions"><button className="ad-btn primary" type="submit">Tạo đặt phòng</button></div>
        </form>
      )}
    </Modal>
  );
};

// ───────────── Cancel with fee preview ─────────────
const CancelDialog = ({ booking, can, onClose, onDone, notify }) => {
  const [pv, setPv] = useState(null);
  const [waive, setWaive] = useState(false);
  useEffect(() => { api.get(`/bookings/${booking._id}/cancel-preview`).then((r) => setPv(r.data)).catch((e) => notify(errMsg(e), true)); }, [booking._id, notify]);
  const go = async () => {
    try { const r = await api.put(`/bookings/${booking._id}/cancel`, { waiveFee: waive }); notify(r.data.message); onDone(r.data); } catch (e) { notify(errMsg(e), true); }
  };
  return (
    <Modal title="Hủy đặt phòng" onClose={onClose}>
      {!pv ? <div className="ad-empty">Đang tính phí...</div> : (
        <>
          <div className={`ad-alert ${pv.fee > 0 ? 'warning' : 'ok'}`}>
            <strong>{pv.fee > 0 ? `Phí hủy: ${vnd(pv.fee)}` : 'Không mất phí hủy'}</strong><br />{pv.rule}
          </div>
          <p>Đã thu: {vnd(booking.money.paid - booking.money.refunded)} · Hoàn lại dự kiến: <strong>{vnd(waive ? booking.money.paid - booking.money.refunded : pv.suggestedRefund)}</strong></p>
          {can('cancel.waive') && pv.fee > 0 && <label><input type="checkbox" checked={waive} onChange={(e) => setWaive(e.target.checked)} /> Miễn phí hủy (quản lý)</label>}
          <p className="ad-hint">Tiền hoàn trả khách được ghi nhận riêng ở mục “Hoàn tiền”.</p>
          <div className="ad-actions"><button className="ad-btn danger" onClick={go}>Xác nhận hủy</button><button className="ad-btn" onClick={onClose}>Đóng</button></div>
        </>
      )}
    </Modal>
  );
};

// ───────────── Booking detail & folio ─────────────
const BookingDetail = ({ id, rooms, can, onClose, onChanged, notify }) => {
  const [b, setB] = useState(null);
  const [invoice, setInvoice] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [edit, setEdit] = useState(null);
  const [occ, setOcc] = useState(null);
  const [roomPick, setRoomPick] = useState('');
  const [swap, setSwap] = useState({ roomId: '', keepRate: false });
  const [extendTo, setExtendTo] = useState('');
  const [charge, setCharge] = useState({ label: '', category: 'service', amount: '' });
  const [pay, setPay] = useState({ amount: '', method: 'cash', type: 'payment', purpose: 'settlement' });
  const [disc, setDisc] = useState({ percent: '', reason: '' });

  useEffect(() => { api.get(`/bookings/${id}`).then((r) => setB(r.data.booking)).catch((e) => notify(errMsg(e), true)); }, [id, notify]);

  const act = async (fn) => {
    try {
      const r = await fn();
      if (r.data.booking) setB((old) => ({ ...old, ...r.data.booking, room: r.data.booking.room ?? undefined }));
      notify(r.data.message || 'Đã cập nhật.');
      onChanged();
      return true;
    } catch (e) { notify(errMsg(e), true); return false; }
  };
  const put = (path, body) => act(() => api.put(`/bookings/${id}${path}`, body));

  if (!b) return <Modal title="Đặt phòng" onClose={onClose}><div className="ad-empty">Đang tải...</div></Modal>;

  const live = ['pending', 'confirmed', 'checked_in'].includes(b.status);
  const closed = ['cancelled', 'no_show'].includes(b.status);
  const m = b.money;
  const sameType = rooms.filter((r) => r.type === b.roomType && r.status === 'available');
  const otherRooms = rooms.filter((r) => r._id !== b.room?._id && r.status === 'available');
  const arrivalPassed = new Date(b.checkIn) <= new Date();
  const deposits = b.payments.filter((p) => p.purpose === 'deposit' && p.type === 'payment').reduce((s, p) => s + p.amount, 0);
  const depositDue = Math.round(m.grand * (b.policy?.depositPercent || 0) / 100);

  return (
    <>
      <Modal wide title={`Đặt phòng ${b.bookingCode}`} onClose={onClose}>
        <div className="ad-actions ad-section">
          <BookingBadge status={b.status} /> <PayBadge status={b.paymentStatus} />
          <Badge tone="gold">{b.ratePlanName || 'Giá chuẩn'}</Badge> <Badge>{SOURCES[b.source] || b.source}</Badge>
          {b.discountPercent > 0 && <Badge tone="green">Giảm {b.discountPercent}%</Badge>}
          {b.policy?.nonRefundable && <Badge tone="red">Không hoàn hủy</Badge>}
        </div>

        <div className="ad-actions ad-section">
          {can('bookings.manage') && b.status === 'pending' && <button className="ad-btn primary" onClick={() => put('/status', { status: 'confirmed' })}>Xác nhận</button>}
          {can('bookings.manage') && ['pending', 'confirmed'].includes(b.status) && (
            <>
              {!b.room && (
                <select className="ad-select" style={{ width: 'auto' }} value={roomPick} onChange={(e) => setRoomPick(e.target.value)}>
                  <option value="">Tự chọn phòng sạch</option>
                  {sameType.map((r) => <option key={r._id} value={r._id}>{r.roomNumber} · {r.hkStatus === 'dirty' ? 'bẩn' : 'sạch'}</option>)}
                </select>
              )}
              <button className="ad-btn primary" onClick={() => put('/check-in', { roomId: roomPick || undefined })}>Check-in</button>
            </>
          )}
          {can('bookings.manage') && b.status === 'checked_in' && (
            <button className="ad-btn primary" onClick={async () => {
              if (m.balance > 0 && can('checkout.override') && !window.confirm(`Còn phải thu ${vnd(m.balance)}. Vẫn check-out (ghi nhận công nợ)?`)) return;
              await put('/check-out', { allowUnpaid: m.balance > 0 && can('checkout.override') });
            }}>Check-out</button>
          )}
          {can('bookings.manage') && ['pending', 'confirmed'].includes(b.status) && arrivalPassed && (
            <button className="ad-btn danger" onClick={() => window.confirm('Đánh dấu khách không đến (no-show)? Phí sẽ được tính theo chính sách gói giá.') && put('/no-show', {})}>No-show</button>
          )}
          {can('bookings.cancel') && ['pending', 'confirmed'].includes(b.status) && <button className="ad-btn danger" onClick={() => setCancel(true)}>Hủy đặt phòng</button>}
          <button className="ad-btn" onClick={() => setInvoice(true)}>Hóa đơn</button>
        </div>

        {b.status === 'confirmed' && depositDue > deposits && (
          <div className="ad-alert warning">Gói giá yêu cầu cọc {b.policy.depositPercent}% = {vnd(depositDue)}; đã cọc {vnd(deposits)}.</div>
        )}

        <div className="ad-grid c2">
          <div>
            <div className="ad-section">
              <h4>Khách hàng {['pending', 'confirmed', 'checked_in'].includes(b.status) && !edit && can('bookings.manage') && <button className="ad-btn sm" onClick={() => setEdit({ ...b.guestInfo })}>Sửa</button>}</h4>
              {edit ? (
                <div className="ad-form-grid">
                  {['name', 'phone', 'email', 'idNumber', 'nationality'].map((k) => (
                    <Field key={k} label={{ name: 'Họ tên', phone: 'SĐT', email: 'Email', idNumber: 'CCCD/Hộ chiếu', nationality: 'Quốc tịch' }[k]}>
                      <input className="ad-input" value={edit[k] || ''} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} />
                    </Field>
                  ))}
                  <div className="full ad-actions">
                    <button className="ad-btn primary sm" onClick={async () => (await act(() => api.put(`/bookings/${id}`, { guestInfo: edit }))) && setEdit(null)}>Lưu</button>
                    <button className="ad-btn sm" onClick={() => setEdit(null)}>Hủy</button>
                  </div>
                </div>
              ) : (
                <dl className="ad-kv">
                  <dt>Họ tên</dt><dd>{b.guestInfo.name}</dd>
                  <dt>SĐT / Email</dt><dd>{b.guestInfo.phone} · {b.guestInfo.email}</dd>
                  <dt>CCCD/Hộ chiếu</dt><dd>{b.guestInfo.idNumber || <span style={{ color: '#dc3545' }}>Chưa có (bắt buộc khi check-in)</span>}</dd>
                  <dt>Quốc tịch</dt><dd>{b.guestInfo.nationality}</dd>
                  <dt>Số khách</dt><dd>{b.guests.adults} người lớn, {b.guests.children || 0} trẻ em</dd>
                </dl>
              )}
            </div>

            <div className="ad-section">
              <h4>Lưu trú</h4>
              <dl className="ad-kv">
                <dt>Hạng phòng</dt><dd>{b.roomType}</dd>
                <dt>Phòng</dt><dd>{roomLabel(b) || <Badge tone="yellow">Chưa gán phòng</Badge>}</dd>
                <dt>Thời gian</dt><dd>{dmy(b.checkIn)} → {dmy(b.checkOut)} ({b.nights} đêm)</dd>
                <dt>Chính sách</dt><dd>{b.policy?.nonRefundable ? 'Không hoàn hủy' : `Hủy miễn phí trước ${b.policy?.freeCancelHours}h, sau đó tính ${b.policy?.penaltyNights} đêm`}</dd>
                {b.actualCheckIn && <><dt>Check-in thực tế</dt><dd>{new Date(b.actualCheckIn).toLocaleString('vi-VN')}</dd></>}
                {b.actualCheckOut && <><dt>Check-out thực tế</dt><dd>{new Date(b.actualCheckOut).toLocaleString('vi-VN')}</dd></>}
                {b.cancellation?.at && <><dt>Hủy lúc</dt><dd>{new Date(b.cancellation.at).toLocaleString('vi-VN')} · phí {vnd(b.cancellation.fee || 0)}</dd></>}
              </dl>
              {live && can('bookings.manage') && (
                <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                  {!b.room && ['pending', 'confirmed'].includes(b.status) && (
                    <div className="ad-actions">
                      <select className="ad-select" style={{ flex: 1 }} value={roomPick} onChange={(e) => setRoomPick(e.target.value)}>
                        <option value="">Gán phòng tự động</option>
                        {sameType.map((r) => <option key={r._id} value={r._id}>{r.roomNumber} · tầng {r.floor}</option>)}
                      </select>
                      <button className="ad-btn sm" onClick={() => put('/assign-room', { roomId: roomPick || undefined })}>Gán phòng</button>
                    </div>
                  )}
                  {b.room && (
                    <div className="ad-actions">
                      <select className="ad-select" style={{ flex: 1 }} value={swap.roomId} onChange={(e) => setSwap({ ...swap, roomId: e.target.value })}>
                        <option value="">Đổi sang phòng...</option>
                        {otherRooms.map((r) => <option key={r._id} value={r._id}>{r.roomNumber || '—'} · {r.type}{r.hkStatus === 'dirty' ? ' (bẩn)' : ''}</option>)}
                      </select>
                      <label className="ad-hint"><input type="checkbox" checked={swap.keepRate} onChange={(e) => setSwap({ ...swap, keepRate: e.target.checked })} /> Giữ giá cũ (nâng hạng miễn phí)</label>
                      <button className="ad-btn sm" disabled={!swap.roomId} onClick={async () => (await put('/change-room', swap)) && setSwap({ roomId: '', keepRate: false })}>Đổi phòng</button>
                    </div>
                  )}
                  <div className="ad-actions">
                    <input className="ad-input" style={{ flex: 1 }} type="date" min={ymd(b.checkOut)} value={extendTo} onChange={(e) => setExtendTo(e.target.value)} />
                    <button className="ad-btn sm" disabled={!extendTo} onClick={async () => (await put('/extend', { checkOut: extendTo })) && setExtendTo('')}>Gia hạn</button>
                  </div>
                </div>
              )}
            </div>

            <div className="ad-section">
              <h4>Khách lưu trú & khai báo tạm trú</h4>
              {occ ? (
                <>
                  {occ.map((o, i) => (
                    <div key={i} className="ad-form-grid" style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px dotted #dee2e6' }}>
                      <Field label="Họ tên"><input className="ad-input" value={o.name || ''} onChange={(e) => setOcc(occ.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} /></Field>
                      <Field label="Loại giấy tờ"><select className="ad-select" value={o.idType || 'cccd'} onChange={(e) => setOcc(occ.map((x, j) => (j === i ? { ...x, idType: e.target.value } : x)))}><option value="cccd">CCCD</option><option value="passport">Hộ chiếu</option></select></Field>
                      <Field label="Số giấy tờ"><input className="ad-input" value={o.idNumber || ''} onChange={(e) => setOcc(occ.map((x, j) => (j === i ? { ...x, idNumber: e.target.value } : x)))} /></Field>
                      <Field label="Quốc tịch"><input className="ad-input" value={o.nationality || ''} onChange={(e) => setOcc(occ.map((x, j) => (j === i ? { ...x, nationality: e.target.value } : x)))} /></Field>
                      <Field label="Ngày sinh"><input className="ad-input" type="date" value={o.dob ? ymd(o.dob) : ''} onChange={(e) => setOcc(occ.map((x, j) => (j === i ? { ...x, dob: e.target.value } : x)))} /></Field>
                      <Field label="Hạn visa / ngày nhập cảnh"><input className="ad-input" type="date" value={o.entryDate ? ymd(o.entryDate) : ''} onChange={(e) => setOcc(occ.map((x, j) => (j === i ? { ...x, entryDate: e.target.value } : x)))} /></Field>
                      <button type="button" className="ad-btn sm danger" onClick={() => setOcc(occ.filter((_, j) => j !== i))}>Xóa người này</button>
                    </div>
                  ))}
                  <div className="ad-actions">
                    <button className="ad-btn sm" onClick={() => setOcc([...occ, { name: '', idType: 'cccd', idNumber: '', nationality: 'Việt Nam' }])}>+ Thêm người</button>
                    <button className="ad-btn sm primary" onClick={async () => (await act(() => api.put(`/bookings/${id}/occupants`, { occupants: occ }))) && setOcc(null)}>Lưu</button>
                    <button className="ad-btn sm" onClick={() => setOcc(null)}>Đóng</button>
                  </div>
                </>
              ) : (
                <>
                  {b.occupants.length === 0 ? <div className="ad-hint">Chưa nhập thông tin khách lưu trú.</div> : (
                    <ul className="ad-list">{b.occupants.map((o, i) => <li key={i}><span>{o.name}</span><span className="ad-hint">{o.idType === 'passport' ? 'Hộ chiếu' : 'CCCD'} {o.idNumber} · {o.nationality}</span></li>)}</ul>
                  )}
                  <div className="ad-actions" style={{ marginTop: 6 }}>
                    {(can('residence') || can('bookings.manage')) && <button className="ad-btn sm" onClick={() => setOcc(b.occupants.length ? b.occupants.map((o) => ({ ...o })) : [{ name: b.guestInfo.name, idType: 'cccd', idNumber: b.guestInfo.idNumber, nationality: b.guestInfo.nationality }])}>Nhập / sửa</button>}
                    {b.status === 'checked_in' && can('residence') && (b.residence?.registered
                      ? <Badge tone="green">Đã khai báo lưu trú</Badge>
                      : <button className="ad-btn sm primary" onClick={() => act(() => api.put(`/bookings/${id}/residence`, { registered: true }))}>Đánh dấu đã khai báo lưu trú</button>)}
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <div className="ad-section">
              <h4>Hóa đơn lưu trú (folio)</h4>
              <ul className="ad-list">
                <li><span>Tiền phòng ({b.nights} đêm{b.discountPercent ? `, giảm ${b.discountPercent}%` : ''})</span><span>{vnd(m.room)}</span></li>
                {b.charges.map((c) => (
                  <li key={c._id}>
                    <span>{c.label} <small className="ad-hint">({CHARGE_CATEGORIES[c.category]}{c.by ? ` · ${c.by}` : ''})</small></span>
                    <span>{vnd(c.amount)} {live && can('folio.void') && c.category !== 'fee' && <button className="ad-btn sm danger" onClick={() => act(() => api.delete(`/bookings/${id}/charges/${c._id}`))}>×</button>}</span>
                  </li>
                ))}
                <li><span>Phí phục vụ ({b.serviceChargeRate}%)</span><span>{vnd(m.service)}</span></li>
                <li><span>VAT ({b.vatRate}%)</span><span>{vnd(m.vat)}</span></li>
                <li><strong>Tổng cộng</strong><strong>{vnd(m.grand)}</strong></li>
                {b.payments.map((p) => (
                  <li key={p._id}><span>{p.type === 'refund' ? 'Hoàn tiền' : p.purpose === 'deposit' ? 'Đặt cọc' : 'Thanh toán'} · {METHODS[p.method]} <small className="ad-hint">{dmy(p.at)}{p.by ? ` · ${p.by}` : ''}</small></span><span>{p.type === 'refund' ? '-' : ''}{vnd(p.amount)}</span></li>
                ))}
                <li><strong>Còn phải thu</strong><strong>{vnd(m.balance)}</strong></li>
              </ul>

              {!['cancelled', 'no_show'].includes(b.status) && can('folio.post') && (
                <div className="ad-actions" style={{ marginTop: 8 }}>
                  <input className="ad-input" style={{ flex: 2, minWidth: 90 }} placeholder="Khoản phí (Spa, minibar...)" value={charge.label} onChange={(e) => setCharge({ ...charge, label: e.target.value })} />
                  <select className="ad-select" style={{ width: 110 }} value={charge.category} onChange={(e) => setCharge({ ...charge, category: e.target.value })}>
                    {Object.entries(CHARGE_CATEGORIES).filter(([k]) => k !== 'fee').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <input className="ad-input" style={{ width: 110 }} type="number" min="0" placeholder="Số tiền" value={charge.amount} onChange={(e) => setCharge({ ...charge, amount: e.target.value })} />
                  <button className="ad-btn sm" onClick={async () => (await act(() => api.post(`/bookings/${id}/charges`, charge))) && setCharge({ label: '', category: 'service', amount: '' })}>Thêm phí</button>
                  <button className="ad-btn sm" onClick={() => act(() => api.post(`/bookings/${id}/charges`, { preset: 'early_checkin' }))}>Phụ thu check-in sớm</button>
                  <button className="ad-btn sm" onClick={() => act(() => api.post(`/bookings/${id}/charges`, { preset: 'late_checkout' }))}>Phụ thu check-out muộn</button>
                </div>
              )}
              {can('payments.take') && b.status !== 'cancelled' && (
                <div className="ad-actions" style={{ marginTop: 8 }}>
                  <select className="ad-select" style={{ width: 120 }} value={`${pay.type}:${pay.purpose}`} onChange={(e) => { const [type, purpose] = e.target.value.split(':'); setPay({ ...pay, type, purpose }); }}>
                    <option value="payment:settlement">Thu tiền</option>
                    <option value="payment:deposit">Đặt cọc</option>
                    {can('payments.refund') && <option value="refund:settlement">Hoàn tiền</option>}
                  </select>
                  <select className="ad-select" style={{ width: 130 }} value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>{Object.entries(METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                  <input className="ad-input" style={{ width: 120 }} type="number" min="0" placeholder={m.balance ? String(m.balance) : 'Số tiền'} value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} />
                  <button className="ad-btn sm primary" onClick={async () => (await act(() => api.post(`/bookings/${id}/payments`, { ...pay, amount: pay.amount || m.balance }))) && setPay({ ...pay, amount: '' })}>Ghi nhận</button>
                </div>
              )}
              {live && can('discount') && (
                <div className="ad-actions" style={{ marginTop: 8 }}>
                  <input className="ad-input" style={{ width: 90 }} type="number" min="0" max="100" placeholder="Giảm %" value={disc.percent} onChange={(e) => setDisc({ ...disc, percent: e.target.value })} />
                  <input className="ad-input" style={{ flex: 1 }} placeholder="Lý do giảm giá" value={disc.reason} onChange={(e) => setDisc({ ...disc, reason: e.target.value })} />
                  <button className="ad-btn sm" disabled={disc.percent === ''} onClick={async () => (await put('/discount', disc)) && setDisc({ percent: '', reason: '' })}>Áp dụng giảm giá</button>
                </div>
              )}
              <p className="ad-hint">Tiền mặt chỉ thu được khi bạn đã mở ca ở tab “Ca thu ngân”. Giảm giá tối đa theo vai trò: lễ tân/sales 10%, quản lý 30%.</p>
            </div>
          </div>
        </div>

        <div className="ad-section">
          <h4>Lịch sử đặt phòng</h4>
          <ul className="ad-list" style={{ maxHeight: 150, overflowY: 'auto' }}>
            {[...b.history].reverse().map((h) => <li key={h._id}><span>{h.action}</span><span className="ad-hint">{h.by} · {new Date(h.at).toLocaleString('vi-VN')}</span></li>)}
          </ul>
        </div>
      </Modal>
      {invoice && <InvoiceModal bookingId={id} onClose={() => setInvoice(false)} />}
      {cancel && <CancelDialog booking={b} can={can} notify={notify} onClose={() => setCancel(false)} onDone={(d) => { setCancel(false); setB((old) => ({ ...old, ...d.booking })); onChanged(); }} />}
    </>
  );
};

// ───────────── Calendar ─────────────
const Calendar = ({ rooms, bookings, start, days, onOpen }) => {
  const todayKey = today();
  const dates = Array.from({ length: days }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  const cols = `150px repeat(${days}, minmax(34px, 1fr))`;
  const dayIdx = (d) => Math.round((new Date(new Date(d).setHours(0, 0, 0, 0)) - start) / 864e5);
  const live = bookings.filter((b) => !['cancelled', 'no_show'].includes(b.status));
  const byRoom = useMemo(() => {
    const map = {};
    for (const b of live) if (b.room?._id) (map[b.room._id] ||= []).push(b);
    return map;
  }, [live]);
  const unassigned = live.filter((b) => !b.room?._id);

  const cells = (rowKey) => dates.map((d, i) => <div key={`${rowKey}${i}`} style={{ gridColumn: i + 2 }} className={`ad-cal-cell ${ymd(d) === todayKey ? 'today' : [0, 6].includes(d.getDay()) ? 'weekend' : ''}`} />);
  const bar = (b) => {
    const s = Math.max(0, dayIdx(b.checkIn));
    const e = Math.min(days, dayIdx(b.checkOut));
    if (e <= s) return null;
    return (
      <button key={b._id} className={`ad-cal-bar ${b.status}`} style={{ gridColumn: `${s + 2} / ${e + 2}` }} title={`${b.guestInfo.name} · ${dmy(b.checkIn)} → ${dmy(b.checkOut)}`} onClick={() => onOpen(b._id)}>
        {b.guestInfo.name}
      </button>
    );
  };

  return (
    <div className="ad-cal">
      <div className="ad-cal-inner">
        <div className="ad-cal-row ad-cal-head" style={{ gridTemplateColumns: cols }}>
          <div className="ad-cal-label">Phòng</div>
          {dates.map((d) => <div key={+d} className={`ad-cal-cell ${ymd(d) === todayKey ? 'today' : ''}`}>{d.getDate()}<br />{['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()]}</div>)}
        </div>
        {unassigned.map((b) => (
          <div className="ad-cal-row" key={b._id} style={{ gridTemplateColumns: cols }}>
            <div className="ad-cal-label" style={{ background: '#fff8e1' }}>Chưa gán<small>{b.roomType}</small></div>
            {cells(b._id)}
            {bar(b)}
          </div>
        ))}
        {rooms.map((r) => (
          <div className="ad-cal-row" key={r._id} style={{ gridTemplateColumns: cols }}>
            <div className="ad-cal-label">{r.roomNumber || '—'}<small>{r.type}</small></div>
            {cells(r._id)}
            {(byRoom[r._id] || []).map(bar)}
          </div>
        ))}
      </div>
    </div>
  );
};

// ───────────── Tab ─────────────
const BookingsTab = ({ notify, can }) => {
  const [view, setView] = useState('list');
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [calStart, setCalStart] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - 2); return d; });
  const [calDays, setCalDays] = useState(21);
  const [openId, setOpenId] = useState(null);
  const [creating, setCreating] = useState(false);
  const LIMIT = 15;

  const loadRooms = useCallback(() => (can('rooms.view') ? api.get('/rooms/board').then((r) => setRooms(r.data.rooms)).catch(() => {}) : Promise.resolve()), [can]);
  const load = useCallback(() => {
    const params = view === 'list'
      ? { status, source, q, page, limit: LIMIT }
      : { from: ymd(calStart), to: ymd(new Date(calStart.getTime() + calDays * 864e5)), limit: 500 };
    api.get('/bookings', { params }).then((r) => { setBookings(r.data.bookings); setTotal(r.data.total); }).catch((e) => notify(errMsg(e), true));
  }, [view, status, source, q, page, calStart, calDays, notify]);

  useEffect(() => { loadRooms(); }, [loadRooms]);
  useEffect(() => { const t = setTimeout(load, q ? 300 : 0); return () => clearTimeout(t); }, [load, q]);

  const quick = async (b, path, body) => {
    try { const r = await api.put(`/bookings/${b._id}${path}`, body); notify(r.data.message); load(); loadRooms(); } catch (e) { notify(errMsg(e), true); }
  };
  const refresh = () => { load(); loadRooms(); };
  const pages = Math.max(1, Math.ceil(total / LIMIT));
  const manage = can('bookings.manage');

  return (
    <>
      <div className="ad-toolbar">
        <div className="ad-tabs">
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>Danh sách</button>
          <button className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}>Lịch đặt phòng</button>
        </div>
        {view === 'list' ? (
          <>
            <input className="ad-input grow" placeholder="Tìm mã, tên, SĐT, email..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
            <select className="ad-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ xác nhận</option><option value="confirmed">Đã xác nhận</option>
              <option value="checked_in">Đang ở</option><option value="checked_out">Đã trả phòng</option>
              <option value="cancelled">Đã hủy</option><option value="no_show">No-show</option>
            </select>
            <select className="ad-select" value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }}>
              <option value="">Mọi nguồn</option>
              {Object.entries(SOURCES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </>
        ) : (
          <>
            <input className="ad-input" type="date" value={ymd(calStart)} onChange={(e) => e.target.value && setCalStart(new Date(e.target.value + 'T00:00:00'))} />
            <select className="ad-select" value={calDays} onChange={(e) => setCalDays(+e.target.value)}><option value={14}>14 ngày</option><option value={21}>21 ngày</option><option value={30}>30 ngày</option></select>
            <span className="grow ad-hint">Vàng: chờ · Xanh: xác nhận · Đỏ: đang ở · Xám: đã trả. Hàng “Chưa gán” là đặt phòng chưa có số phòng.</span>
          </>
        )}
        {manage && <button className="ad-btn primary" onClick={() => setCreating(true)}><FiPlus /> Tạo đặt phòng</button>}
      </div>

      {view === 'list' ? (
        <div className="ad-card">
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead><tr><th>Mã</th><th>Khách</th><th>Phòng</th><th>Thời gian</th><th>Gói / nguồn</th><th>Tổng tiền</th><th>Trạng thái</th><th>Thanh toán</th><th /></tr></thead>
              <tbody>
                {bookings.length === 0 && <tr><td colSpan="9" className="ad-empty">Không có đặt phòng nào</td></tr>}
                {bookings.map((b) => (
                  <tr key={b._id} className="click" onClick={() => setOpenId(b._id)}>
                    <td><strong>{b.bookingCode}</strong></td>
                    <td>{b.guestInfo.name}<small>{b.guestInfo.phone}</small></td>
                    <td>{roomLabel(b) || <><span>{b.roomType}</span><small style={{ color: '#b45309' }}>Chưa gán phòng</small></>}</td>
                    <td>{dmy(b.checkIn)} → {dmy(b.checkOut)}<small>{b.nights} đêm</small></td>
                    <td>{b.ratePlanName || '—'}<small>{SOURCES[b.source] || b.source}</small></td>
                    <td className="num">{vnd(b.money.grand)}{b.money.balance > 0 && !['cancelled', 'no_show'].includes(b.status) && <small>Còn {vnd(b.money.balance)}</small>}</td>
                    <td><BookingBadge status={b.status} /></td>
                    <td><PayBadge status={b.paymentStatus} /></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {manage && (
                        <div className="ad-actions">
                          {b.status === 'pending' && <button className="ad-btn sm" onClick={() => quick(b, '/status', { status: 'confirmed' })}>Xác nhận</button>}
                          {['pending', 'confirmed'].includes(b.status) && new Date(b.checkIn) <= new Date() && <button className="ad-btn sm" onClick={() => quick(b, '/check-in', {})}>Check-in</button>}
                          {b.status === 'checked_in' && <button className="ad-btn sm" onClick={() => quick(b, '/check-out', {})}>Check-out</button>}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ad-toolbar" style={{ marginTop: 12, marginBottom: 0, justifyContent: 'space-between' }}>
            <span className="ad-hint">{total} đặt phòng</span>
            <div className="ad-actions">
              <button className="ad-btn sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹ Trước</button>
              <span className="ad-hint" style={{ alignSelf: 'center' }}>{page}/{pages}</span>
              <button className="ad-btn sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Sau ›</button>
            </div>
          </div>
        </div>
      ) : (
        <Calendar rooms={rooms} bookings={bookings} start={calStart} days={calDays} onOpen={setOpenId} />
      )}

      {openId && <BookingDetail id={openId} rooms={rooms} can={can} notify={notify} onClose={() => setOpenId(null)} onChanged={refresh} />}
      {creating && <CreateBooking rooms={rooms} notify={notify} onClose={() => setCreating(false)} onCreated={() => { setCreating(false); refresh(); }} />}
    </>
  );
};

export default BookingsTab;
