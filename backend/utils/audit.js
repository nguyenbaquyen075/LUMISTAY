const AuditLog = require('../models/AuditLog');

// Fire-and-forget: an audit failure must never break the action being audited
const audit = (req, action, entity, entityId, summary) => {
  AuditLog.create({
    user: req.user?._id, userName: req.user?.name || 'Khách (online)', role: req.user?.role,
    action, entity, entityId: entityId ? String(entityId) : undefined, summary
  }).catch((e) => console.error('audit', e.message));
};

module.exports = audit;
