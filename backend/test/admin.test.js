// Smoke test of the admin / PMS API against a throwaway DB (seeded by utils/demoSeed.js):
//   MONGODB_URI=mongodb://127.0.0.1:27017/lumistay_test node utils/demoSeed.js
//   MONGODB_URI=mongodb://127.0.0.1:27017/lumistay_test node --test test/admin.test.js
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');

const PORT = 5099;
const BASE = `http://127.0.0.1:${PORT}/api`;
let server;
const tokens = {};

const call = async (method, path, token, body) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  return { status: res.status, data: await res.json() };
};
const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const guest = (tag) => ({ name: `Test ${tag}`, email: `test.${tag}.${Date.now()}@example.com`, phone: '0900000000', idNumber: '012345678901' });

before(async () => {
  assert.match(process.env.MONGODB_URI || '', /test/, 'Refusing to run against a non-test database');
  server = spawn('node', ['server.js'], { env: { ...process.env, PORT }, stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(BASE + '/health')).ok) break; } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  for (const [k, email, password] of [
    ['admin', 'admin@lumistay.com', 'admin123456'], ['manager', 'manager@lumistay.com', 'manager123'], ['staff', 'letan@lumistay.com', 'letan123'],
    ['hk', 'hk1@lumistay.com', 'hk123456'], ['cashier', 'thungan@lumistay.com', 'thungan123'], ['acct', 'ketoan@lumistay.com', 'ketoan123'], ['sales', 'sales@lumistay.com', 'sales123']
  ]) {
    tokens[k] = (await call('POST', '/auth/login', null, { email, password })).data.token;
    assert.ok(tokens[k], `login ${k}`);
  }
});
after(() => server?.kill());

test('role permissions', async () => {
  const code = async (method, path, who, body) => (await call(method, path, tokens[who], body)).status;
  assert.equal(await code('GET', '/admin/dashboard', 'staff'), 403);
  assert.equal(await code('GET', '/admin/dashboard', 'manager'), 200);
  assert.equal(await code('GET', '/admin/staff', 'manager'), 403);
  assert.equal(await code('GET', '/admin/staff', 'admin'), 200);
  assert.equal(await code('GET', '/admin/dashboard'), 401);
  assert.equal(await code('GET', '/admin/housekeeping', 'hk'), 200);
  assert.equal(await code('GET', '/admin/dashboard', 'hk'), 403);
  assert.equal(await code('GET', '/bookings', 'hk'), 200); // returns only "own" bookings (none) for non-viewers
  assert.equal(await code('GET', '/admin/finance', 'acct'), 200);
  assert.equal(await code('GET', '/admin/finance', 'staff'), 403);
  assert.equal(await code('POST', '/admin/night-audit/run', 'staff'), 403);
  assert.equal(await code('GET', '/config/settings', 'staff'), 200);
  assert.equal(await code('PUT', '/config/settings', 'staff', { vatRate: 8 }), 403);
  assert.equal(await code('PUT', '/config/settings', 'manager', { vatRate: 150 }), 400);
  assert.equal(await code('POST', '/bookings/admin/create', 'cashier', {}), 403);
  assert.equal(await code('GET', '/admin/audit', 'staff'), 403);
  assert.equal(await code('GET', '/admin/audit', 'manager'), 200);
  const hkBookings = (await call('GET', '/bookings', tokens.hk)).data.bookings;
  assert.equal(hkBookings.length, 0);
});

test('dashboard and KPIs are coherent', async () => {
  const { data } = await call('GET', '/admin/dashboard', tokens.manager);
  assert.ok(data.revenue.week >= data.revenue.today && data.revenue.month >= data.revenue.today); // week may start in the previous month
  const r = data.rooms;
  assert.equal(r.available + r.reserved + r.occupied + r.cleaning + r.maintenance + r.locked, r.total);
  assert.equal(data.series.length, 30);
  assert.equal(data.forecast.days.length, 7);
  assert.ok(data.kpi.month.occupancy >= 0 && data.kpi.month.occupancy <= 1);
  assert.ok(Math.abs(data.kpi.month.revpar - data.kpi.month.occupancy * data.kpi.month.adr) < 1, 'RevPAR = occupancy × ADR');
});

test('availability and pricing by room type / rate plan', async () => {
  const { data } = await call('GET', `/bookings/availability?checkIn=${day(60)}&checkOut=${day(62)}&adults=2`, tokens.staff);
  assert.ok(data.types.length >= 3);
  const t = data.types.find((x) => x.free > 0 && x.plans.length >= 3);
  assert.ok(t, 'a type with several plans');
  const bar = t.plans.find((p) => p.code === 'BAR');
  const nrf = t.plans.find((p) => p.code === 'NRF');
  assert.ok(nrf.total < bar.total, 'non-refundable is cheaper');
  const pub = (await call('GET', `/bookings/availability?checkIn=${day(60)}&checkOut=${day(62)}`)).data.types[0];
  assert.ok(!pub.plans.some((p) => p.code === 'CORP'), 'staff-only plan hidden from the public');
  assert.equal((await call('GET', `/bookings/availability?checkIn=${day(62)}&checkOut=${day(60)}`)).status, 400);
});

test('booking lifecycle: type booking → deposit → room assignment → check-in → folio → tax → pay → check-out → dirty room', async () => {
  const avail = (await call('GET', `/bookings/availability?checkIn=${day(0)}&checkOut=${day(2)}&adults=2`, tokens.staff)).data.types;
  const t = avail.find((x) => x.free > 0 && x.fits);
  const plan = t.plans.find((p) => p.code === 'BAR');
  const body = { roomType: t.type.name, ratePlanId: plan._id, checkIn: day(0), checkOut: day(2), guests: { adults: 2 }, status: 'confirmed', guestInfo: guest('life'), deposit: { amount: 500000, method: 'cash' } };

  assert.equal((await call('POST', '/bookings/admin/create', tokens.staff, body)).status, 400); // cash deposit needs an open shift
  await call('POST', '/admin/shifts/open', tokens.staff, { openingCash: 1000000 });
  const created = await call('POST', '/bookings/admin/create', tokens.staff, body);
  assert.equal(created.status, 201);
  const b = created.data.booking;
  assert.equal(b.room, undefined, 'room is not assigned yet');
  assert.equal(b.nights, 2);
  assert.equal(b.nightlyRates.length, 2);
  assert.equal(b.payments[0].purpose, 'deposit');
  const id = b._id;
  const m0 = b.money;
  const net = b.totalPrice;
  assert.equal(m0.service, Math.round(net * 0.05));
  assert.equal(m0.vat, Math.round((net + m0.service) * 0.1));
  assert.equal(m0.grand, net + m0.service + m0.vat);

  assert.equal((await call('PUT', `/bookings/${id}/check-out`, tokens.staff)).status, 400); // not checked in yet
  const ci = await call('PUT', `/bookings/${id}/check-in`, tokens.staff, {});
  assert.equal(ci.status, 200, ci.data.message);
  const roomId = ci.data.booking.room._id;
  assert.equal(ci.data.booking.room.type, t.type.name);

  const charged = await call('POST', `/bookings/${id}/charges`, tokens.staff, { label: 'Minibar', category: 'minibar', amount: 200000 });
  assert.equal(charged.data.booking.money.extras, 200000);
  const late = await call('POST', `/bookings/${id}/charges`, tokens.staff, { preset: 'late_checkout' });
  assert.equal(late.status, 200);
  assert.equal((await call('DELETE', `/bookings/${id}/charges/${late.data.booking.charges[1]._id}`, tokens.staff)).status, 403); // voiding is manager-only
  assert.equal((await call('DELETE', `/bookings/${id}/charges/${late.data.booking.charges[1]._id}`, tokens.manager)).status, 200);

  const inv = (await call('GET', `/bookings/${id}/invoice`, tokens.staff)).data.invoice;
  assert.equal(inv.split.room.total + inv.split.extras.total + inv.fees, inv.grand);
  const due = inv.balance;
  assert.ok(due > 0 && due < inv.grand, 'deposit reduces the balance');

  const blocked = await call('PUT', `/bookings/${id}/check-out`, tokens.staff);
  assert.equal(blocked.status, 400);
  assert.match(blocked.data.message, /phải thu/);
  assert.equal((await call('PUT', `/bookings/${id}/check-out`, tokens.staff, { allowUnpaid: true })).status, 403);
  assert.equal((await call('POST', `/bookings/${id}/payments`, tokens.staff, { amount: 1, type: 'refund' })).status, 403); // refunds: managers
  const paid = await call('POST', `/bookings/${id}/payments`, tokens.staff, { amount: due, method: 'cash' });
  assert.equal(paid.data.booking.paymentStatus, 'paid');

  assert.equal((await call('PUT', `/bookings/${id}/check-out`, tokens.staff)).status, 200);
  const board = (await call('GET', '/rooms/board', tokens.staff)).data.rooms.find((x) => x._id === roomId);
  assert.equal(board.hkStatus, 'dirty');
  assert.equal(board.displayStatus, 'cleaning');

  // housekeeping cleans; only supervisors inspect
  assert.equal((await call('PUT', `/rooms/${roomId}/housekeeping`, tokens.hk, { hkStatus: 'inspected' })).status, 403);
  assert.equal((await call('PUT', `/rooms/${roomId}/housekeeping`, tokens.hk, { hkStatus: 'clean' })).status, 200);
  assert.equal((await call('PUT', `/rooms/${roomId}/status`, tokens.staff, { status: 'maintenance' })).status, 403);
  assert.equal((await call('PUT', `/rooms/${roomId}/status`, tokens.manager, { status: 'maintenance' })).status, 200);
  assert.equal((await call('PUT', `/rooms/${roomId}/status`, tokens.manager, { status: 'available' })).status, 200);

  // shift reconciles the cash taken
  const cur = (await call('GET', '/admin/shifts/current', tokens.staff)).data.shift;
  assert.equal(cur.cashNet, 500000 + due);
  const closed = await call('POST', '/admin/shifts/close', tokens.staff, { countedCash: 1000000 + 500000 + due - 10000, note: 'test' });
  assert.equal(closed.data.shift.variance, -10000);
  assert.equal((await call('POST', `/bookings/${id}/payments`, tokens.cashier, { amount: 1000, method: 'cash' })).status, 400); // cashier has no open shift
});

test('type inventory, room conflicts and edits', async () => {
  const t = (await call('GET', `/bookings/availability?checkIn=${day(90)}&checkOut=${day(91)}`, tokens.staff)).data.types.find((x) => x.total >= 1 && x.free === x.total);
  const base = { roomType: t.type.name, checkIn: day(90), checkOut: day(91), guests: { adults: 1 }, status: 'confirmed' };
  const made = [];
  for (let i = 0; i < t.total; i++) {
    const r = await call('POST', '/bookings/admin/create', tokens.staff, { ...base, guestInfo: guest('inv' + i) });
    assert.equal(r.status, 201);
    made.push(r.data.booking._id);
  }
  assert.equal((await call('POST', '/bookings/admin/create', tokens.staff, { ...base, guestInfo: guest('over') })).status, 409); // type sold out
  assert.equal((await call('POST', '/bookings', null, { ...base, guestInfo: guest('web') })).status, 409);
  // moving one booking by a day frees nothing for the same night but is allowed elsewhere
  const moved = await call('PUT', `/bookings/${made[0]}`, tokens.staff, { checkIn: day(95), checkOut: day(97) });
  assert.equal(moved.status, 200);
  assert.equal(moved.data.booking.nights, 2);
  assert.equal(moved.data.booking.nightlyRates.length, 2);
  assert.equal((await call('POST', '/bookings/admin/create', tokens.staff, { ...base, guestInfo: guest('again') })).status, 201); // the night opened up
  // minimum stay of a plan
  const plans = (await call('GET', '/config/rate-plans', tokens.manager)).data.ratePlans;
  const bar = plans.find((p) => p.code === 'BAR');
  await call('PUT', `/config/rate-plans/${bar._id}`, tokens.manager, { minStay: 2 });
  assert.equal((await call('POST', '/bookings/admin/create', tokens.staff, { ...base, checkIn: day(120), checkOut: day(121), ratePlanId: bar._id, guestInfo: guest('min') })).status, 400);
  await call('PUT', `/config/rate-plans/${bar._id}`, tokens.manager, { minStay: 1 });
});

test('cancellation policy, no-show and discounts', async () => {
  const types = (await call('GET', `/bookings/availability?checkIn=${day(100)}&checkOut=${day(102)}`, tokens.staff)).data.types;
  const t = types.find((x) => x.free > 0);
  const plan = (code) => t.plans.find((p) => p.code === code)._id;
  const mk = async (planCode, ci, co, tag) => (await call('POST', '/bookings/admin/create', tokens.staff, {
    roomType: t.type.name, ratePlanId: plan(planCode), checkIn: day(ci), checkOut: day(co), guests: { adults: 1 }, status: 'confirmed', guestInfo: guest(tag)
  })).data.booking;

  const free = await mk('BAR', 100, 102, 'free');
  assert.equal((await call('GET', `/bookings/${free._id}/cancel-preview`, tokens.staff)).data.fee, 0);
  const nrf = await mk('NRF', 100, 102, 'nrf');
  assert.equal((await call('GET', `/bookings/${nrf._id}/cancel-preview`, tokens.staff)).data.fee, nrf.totalPrice);
  const late = await mk('BAR', 1, 3, 'late');
  const preview = (await call('GET', `/bookings/${late._id}/cancel-preview`, tokens.staff)).data;
  assert.equal(preview.fee, late.nightlyRates[0]); // inside the 48h window: first night
  assert.equal((await call('PUT', `/bookings/${late._id}/cancel`, tokens.staff, { waiveFee: true })).status, 403);
  const waived = await call('PUT', `/bookings/${late._id}/cancel`, tokens.manager, { waiveFee: true });
  assert.equal(waived.data.fee, 0);
  const charged = await call('PUT', `/bookings/${nrf._id}/cancel`, tokens.staff);
  assert.equal(charged.data.fee, nrf.totalPrice);
  assert.equal(charged.data.booking.money.fees, nrf.totalPrice);
  assert.equal(charged.data.booking.status, 'cancelled');

  // discount limits per role
  assert.equal((await call('PUT', `/bookings/${free._id}/discount`, tokens.staff, { percent: 15 })).status, 403);
  const d10 = await call('PUT', `/bookings/${free._id}/discount`, tokens.staff, { percent: 10, reason: 'Khách quen' });
  assert.equal(d10.data.booking.totalPrice, Math.round(free.nightlyRates.reduce((a, b) => a + b, 0) * 0.9));
  assert.equal((await call('PUT', `/bookings/${free._id}/discount`, tokens.manager, { percent: 25 })).status, 200);
  assert.equal((await call('PUT', `/bookings/${free._id}/discount`, tokens.sales, { percent: 11 })).status, 403);

  // no-show needs the arrival date to have come
  assert.equal((await call('PUT', `/bookings/${free._id}/no-show`, tokens.staff)).status, 400);
});

test('night audit closes the business day', async () => {
  const pre = (await call('GET', '/admin/night-audit', tokens.manager)).data;
  assert.ok(pre.businessDate);
  const run = await call('POST', '/admin/night-audit/run', tokens.manager, {});
  if (pre.canRun) {
    assert.equal(run.status, 200, run.data.message);
    assert.equal(run.data.audit.date, pre.businessDate);
    assert.ok(run.data.audit.figures.available > 0);
  } else {
    assert.equal(run.status, 400);
  }
  const again = await call('POST', '/admin/night-audit/run', tokens.manager, {});
  const next = (await call('GET', '/admin/night-audit', tokens.manager)).data;
  assert.equal(again.status, next.canRun ? 200 : 400);
});

test('customers, blacklist, residence, reports, finance, AI', async () => {
  const c = await call('GET', '/admin/customers', tokens.staff);
  assert.ok(c.data.customers.length > 10);
  assert.ok(c.data.customers.some((x) => x.blacklisted));
  const detail = await call('GET', '/admin/customers/khach1@example.com', tokens.staff);
  assert.ok(detail.data.customer.insight.startsWith('Khách'));
  assert.equal((await call('PUT', '/admin/customers/khach1@example.com', tokens.staff, { vipLevel: 'gold' })).status, 403);
  assert.equal((await call('PUT', '/admin/customers/khach1@example.com', tokens.manager, { vipLevel: 'gold' })).status, 200);

  const t = (await call('GET', `/bookings/availability?checkIn=${day(70)}&checkOut=${day(71)}`)).data.types.find((x) => x.free > 0);
  const blk = { roomType: t.type.name, checkIn: day(70), checkOut: day(71), guests: { adults: 1 }, guestInfo: { name: 'Hans Müller', email: 'khach29@example.com', phone: '0911111111' } };
  assert.equal((await call('POST', '/bookings', null, blk)).status, 403);
  assert.equal((await call('POST', '/bookings/admin/create', tokens.staff, blk)).status, 409);
  const forced = await call('POST', '/bookings/admin/create', tokens.staff, { ...blk, force: true });
  assert.equal(forced.status, 201);

  const res = (await call('GET', '/admin/residence', tokens.staff)).data;
  assert.ok(res.bookings.length > 0);
  assert.ok(res.bookings.some((b) => b.missingId));
  const target = res.bookings[0];
  assert.equal((await call('PUT', `/bookings/${target._id}/residence`, tokens.staff, { registered: true })).data.booking.residence.registered, true);

  const rep = (await call('GET', `/admin/reports?from=${day(-30)}&to=${day(-1)}`, tokens.manager)).data;
  assert.equal(rep.daily.length, 30);
  assert.ok(rep.summary.occupancy > 0 && rep.summary.occupancy <= 1);
  assert.ok(Math.abs(rep.summary.adr * rep.summary.sold - rep.summary.roomRevenue) < 1);
  assert.ok(rep.bySource.length >= 3);
  assert.ok(rep.stats.avgLos > 0 && rep.stats.cancelRate >= 0);
  assert.equal((await call('GET', `/admin/reports?from=${day(-500)}&to=${day(0)}`, tokens.manager)).status, 400);

  const fin = (await call('GET', '/admin/finance', tokens.manager)).data;
  assert.equal(fin.totalRevenue, fin.roomRevenue + fin.serviceRevenue + fin.foodRevenue);
  assert.equal(fin.profit, fin.totalRevenue - fin.totalExpenses);
  const ai = (await call('GET', '/admin/ai/overview', tokens.manager)).data;
  assert.equal(ai.forecast.days.length, 7);
  assert.ok(ai.anomalies.length >= 1);
  assert.equal(ai.segments.segments.reduce((s, x) => s + x.count, 0), ai.segments.total);
  assert.equal((await call('GET', '/admin/ai/overview', tokens.staff)).status, 403);

  const logs = (await call('GET', '/admin/audit?limit=200&entity=booking', tokens.manager)).data;
  assert.ok(logs.total > 0);
  assert.ok(logs.logs.some((l) => l.action === 'booking.checkin'));
});

test('staff management guards', async () => {
  const me = (await call('GET', '/auth/me', tokens.admin)).data.user;
  assert.ok(me.permissions.includes('staff.manage'));
  assert.equal((await call('PUT', `/admin/staff/${me._id}`, tokens.admin, { role: 'manager' })).status, 400);
  const created = await call('POST', '/admin/staff', tokens.admin, { name: 'HK Test', email: `hk${Date.now()}@lumistay.com`, password: 'secret123', role: 'housekeeping' });
  assert.equal(created.status, 201);
  assert.equal((await call('PUT', `/admin/staff/${created.data.staff._id}`, tokens.admin, { isActive: false })).data.staff.isActive, false);
  assert.equal((await call('POST', '/admin/staff', tokens.admin, { name: 'X', email: `x${Date.now()}@l.com`, password: 'secret123', role: 'wizard' })).status, 400);
});
