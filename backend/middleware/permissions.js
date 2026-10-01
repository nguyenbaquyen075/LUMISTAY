// Permission matrix. Routes ask for a permission, not a role, so roles can be tuned in one place.
// admin = Super Admin (everything).
const FRONT_DESK = [
  'rooms.view', 'housekeeping.view', 'housekeeping.update', 'rates.view',
  'bookings.view', 'bookings.manage', 'bookings.cancel', 'folio.post', 'payments.take', 'discount',
  'customers.view', 'customers.edit', 'residence', 'shift.use'
];

const MANAGER = [
  ...FRONT_DESK,
  'dashboard', 'reports.view', 'ai.use', 'rooms.edit', 'rooms.status', 'housekeeping.manage',
  'folio.void', 'payments.refund', 'cancel.waive', 'checkout.override',
  'rates.edit', 'finance.view', 'expenses.edit', 'audit.view', 'audit.run', 'settings.view', 'settings.edit', 'shift.view_all'
];

const ROLE_PERMISSIONS = {
  manager: MANAGER,
  receptionist: FRONT_DESK,
  housekeeping: ['rooms.view', 'housekeeping.view', 'housekeeping.update'],
  cashier: ['bookings.view', 'folio.post', 'payments.take', 'customers.view', 'shift.use'],
  accountant: ['bookings.view', 'customers.view', 'finance.view', 'expenses.edit', 'reports.view', 'audit.view', 'payments.refund'],
  sales: ['bookings.view', 'bookings.manage', 'rates.view', 'customers.view', 'customers.edit', 'reports.view']
};
const ALL = [...new Set(Object.values(ROLE_PERMISSIONS).flat()), 'staff.manage'];

// Max discount (% of room total) a role may grant
const DISCOUNT_LIMIT = { receptionist: 10, sales: 10, manager: 30, admin: 100 };

const STAFF_ROLES = ['admin', 'manager', 'receptionist', 'housekeeping', 'cashier', 'accountant', 'sales'];

const permissionsOf = (role) => (role === 'admin' ? ALL : ROLE_PERMISSIONS[role] || []);
const can = (user, perm) => !!user && permissionsOf(user.role).includes(perm);

// Allow if the user holds ANY of the listed permissions
const need = (...perms) => (req, res, next) => {
  if (!req.user || !perms.some((p) => can(req.user, p))) {
    return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện hành động này.' });
  }
  next();
};

module.exports = { permissionsOf, can, need, DISCOUNT_LIMIT, STAFF_ROLES };
