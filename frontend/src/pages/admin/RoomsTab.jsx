import React, { useCallback, useEffect, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import api from '../../utils/api';
import { Badge, Field, Modal, ROOM_STATUS, HK_STATUS, BookingBadge, errMsg, vnd, dmy } from './ui';

const EMPTY = {
  roomNumber: '', floor: 3, name: '', type: '', price: '', area: 40, maxGuests: 2, bedrooms: 1,
  description: '', images: '', amenities: 'WiFi miễn phí, Smart TV, Minibar, Điều hòa', listed: false, isAvailable: true
};

const RoomForm = ({ room, types, onClose, onSaved, notify }) => {
  const [f, setF] = useState(room
    ? { ...EMPTY, ...room, images: (room.images || []).join(', '), amenities: (room.amenities || []).join(', ') }
    : { ...EMPTY, type: types[0]?.name || '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const save = async (e) => {
    e.preventDefault();
    const list = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);
    const payload = {
      roomNumber: f.roomNumber || undefined, floor: +f.floor, name: f.name, type: f.type, price: f.price === '' ? undefined : +f.price, area: +f.area,
      maxGuests: +f.maxGuests, bedrooms: +f.bedrooms, description: f.description || f.name,
      images: list(f.images), amenities: list(f.amenities), listed: f.listed, isAvailable: f.isAvailable
    };
    try {
      if (room) await api.put(`/rooms/${room._id}`, payload);
      else await api.post('/rooms', payload);
      notify('Đã lưu phòng.');
      onSaved();
    } catch (err) { notify(errMsg(err), true); }
  };

  return (
    <Modal title={room ? `Sửa phòng ${room.roomNumber || room.name}` : 'Thêm phòng'} onClose={onClose}>
      <form onSubmit={save} className="ad-form-grid">
        <Field label="Số phòng"><input className="ad-input" value={f.roomNumber} onChange={set('roomNumber')} placeholder="501" /></Field>
        <Field label="Tầng"><input className="ad-input" type="number" value={f.floor} onChange={set('floor')} /></Field>
        <Field label="Tên phòng" full><input className="ad-input" value={f.name} onChange={set('name')} required /></Field>
        <Field label="Hạng phòng">
          <select className="ad-select" value={f.type} onChange={set('type')} required>{types.map((t) => <option key={t._id}>{t.name}</option>)}</select>
        </Field>
        <Field label="Giá hiển thị trên website (để trống = giá hạng phòng)"><input className="ad-input" type="number" min="0" value={f.price} onChange={set('price')} /></Field>
        <Field label="Sức chứa (khách)"><input className="ad-input" type="number" min="1" value={f.maxGuests} onChange={set('maxGuests')} /></Field>
        <Field label="Diện tích (m²)"><input className="ad-input" type="number" min="1" value={f.area} onChange={set('area')} /></Field>
        <Field label="Mô tả" full><textarea className="ad-textarea" rows={2} value={f.description} onChange={set('description')} /></Field>
        <Field label="Hình ảnh (URL, cách nhau bằng dấu phẩy)" full><input className="ad-input" value={f.images} onChange={set('images')} /></Field>
        <Field label="Tiện nghi (cách nhau bằng dấu phẩy)" full><input className="ad-input" value={f.amenities} onChange={set('amenities')} /></Field>
        <label><input type="checkbox" checked={f.listed} onChange={set('listed')} /> Hiển thị trên website</label>
        <label><input type="checkbox" checked={f.isAvailable} onChange={set('isAvailable')} /> Cho phép đặt</label>
        <div className="full ad-actions"><button className="ad-btn primary" type="submit">Lưu</button></div>
      </form>
    </Modal>
  );
};

const RoomsTab = ({ notify, can }) => {
  const [rooms, setRooms] = useState([]);
  const [types, setTypes] = useState([]);
  const [sel, setSel] = useState(null);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState(null); // null | 'new' | room
  const [typeFilter, setTypeFilter] = useState('');
  const canEdit = can('rooms.edit');
  const canStatus = can('rooms.status');

  const load = useCallback(() => api.get('/rooms/board').then((r) => setRooms(r.data.rooms)).catch((e) => notify(errMsg(e), true)), [notify]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (can('rates.view')) api.get('/config/room-types').then((r) => setTypes(r.data.roomTypes)).catch(() => {}); }, [can]);
  useEffect(() => {
    if (!sel || !can('bookings.view')) return;
    api.get(`/rooms/${sel}/history`).then((r) => setHistory(r.data.bookings)).catch(() => setHistory([]));
  }, [sel, can]);

  const room = rooms.find((r) => r._id === sel);
  const shown = rooms.filter((r) => !typeFilter || r.type === typeFilter);
  const floors = [...new Set(shown.map((r) => r.floor))].sort((a, b) => b - a);

  const put = async (path, body, ok) => {
    try { await api.put(`/rooms/${sel}${path}`, body); notify(ok); load(); } catch (e) { notify(errMsg(e), true); }
  };
  const remove = async () => {
    if (!window.confirm(`Xóa phòng ${room.roomNumber || room.name}?`)) return;
    try { await api.delete(`/rooms/${sel}`); setSel(null); load(); } catch (e) { notify(errMsg(e), true); }
  };

  return (
    <>
      <div className="ad-toolbar">
        <div className="ad-legend grow">
          {Object.entries(ROOM_STATUS).map(([k, v]) => <span key={k}>{v.emoji} {v.label}</span>)}
        </div>
        <select className="ad-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">Tất cả hạng phòng</option>
          {types.map((t) => <option key={t._id}>{t.name}</option>)}
        </select>
        {canEdit && <button className="ad-btn primary" onClick={() => setForm('new')}><FiPlus /> Thêm phòng</button>}
      </div>

      <div className="ad-grid c2-1" style={{ alignItems: 'start' }}>
        <div>
          {floors.map((fl) => (
            <div className="ad-floor" key={fl}>
              <h4>Tầng {fl}</h4>
              <div className="ad-rooms">
                {shown.filter((r) => r.floor === fl).map((r) => (
                  <button key={r._id} className={`ad-room ${r.displayStatus} ${sel === r._id ? 'sel' : ''}`} onClick={() => setSel(r._id)}>
                    <strong>{ROOM_STATUS[r.displayStatus].emoji} {r.roomNumber || '—'}</strong>
                    <small>{r.type}</small>
                    <small>{r.currentBooking?.guestInfo?.name || ROOM_STATUS[r.displayStatus].label}</small>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {rooms.length === 0 && <div className="ad-empty">Chưa có phòng nào.</div>}
        </div>

        <div className="ad-card" style={{ position: 'sticky', top: 74 }}>
          {!room ? <div className="ad-empty">Chọn một phòng để xem chi tiết</div> : (
            <>
              <h3>Phòng {room.roomNumber || '—'} · {room.name}</h3>
              <dl className="ad-kv">
                <dt>Tình trạng</dt><dd><Badge tone="gold">{ROOM_STATUS[room.displayStatus].label}</Badge> <Badge tone={{ clean: 'green', dirty: 'orange', inspected: 'blue' }[room.hkStatus]}>{HK_STATUS[room.hkStatus]}</Badge></dd>
                <dt>Hạng</dt><dd>{room.type} · tầng {room.floor}</dd>
                <dt>Giá hạng phòng</dt><dd>{vnd(room.price)}/đêm</dd>
                <dt>Sức chứa</dt><dd>{room.maxGuests} khách · {room.area}m² · {room.bedrooms} PN</dd>
                <dt>Phụ trách</dt><dd>{room.assignedTo?.name || '—'}</dd>
                <dt>Tiện nghi</dt><dd>{(room.amenities || []).join(', ') || '—'}</dd>
              </dl>
              {room.images?.[0] && <img src={room.images[0]} alt="" style={{ width: '100%', borderRadius: 4, margin: '10px 0' }} />}
              {canStatus && (
                <div className="ad-section">
                  <h4>Ngừng bán (Out of Order)</h4>
                  <div className="ad-actions">
                    <button className="ad-btn sm" onClick={() => put('/status', { status: 'available' }, 'Phòng đã mở bán trở lại.')}>Mở bán</button>
                    <button className="ad-btn sm" onClick={() => put('/status', { status: 'maintenance' }, 'Phòng chuyển sang bảo trì.')}>Bảo trì</button>
                    <button className="ad-btn sm" onClick={() => put('/status', { status: 'locked' }, 'Đã khóa phòng.')}>Khóa phòng</button>
                  </div>
                  <p className="ad-hint">Bảo trì/khóa: phòng không được bán và không được gán cho khách. Dọn dẹp xem tab Buồng phòng.</p>
                </div>
              )}
              {canEdit && (
                <div className="ad-actions" style={{ marginBottom: 12 }}>
                  <button className="ad-btn sm" onClick={() => setForm(room)}>Sửa thông tin</button>
                  <button className="ad-btn sm danger" onClick={remove}>Xóa</button>
                </div>
              )}
              {can('bookings.view') && (
                <div className="ad-section">
                  <h4>Lịch sử sử dụng</h4>
                  {history.length === 0 ? <div className="ad-hint">Chưa có lượt đặt nào.</div> : (
                    <ul className="ad-list" style={{ maxHeight: 220, overflowY: 'auto' }}>
                      {history.map((b) => (
                        <li key={b._id}><span>{b.guestInfo.name}<small className="ad-hint"> · {dmy(b.checkIn)} → {dmy(b.checkOut)}</small></span><BookingBadge status={b.status} /></li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {form && <RoomForm room={form === 'new' ? null : form} types={types} notify={notify} onClose={() => setForm(null)} onSaved={() => { setForm(null); load(); }} />}
    </>
  );
};

export default RoomsTab;
