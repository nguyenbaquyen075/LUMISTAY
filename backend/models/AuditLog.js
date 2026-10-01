const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  at: { type: Date, default: Date.now, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: String,
  role: String,
  action: { type: String, required: true },
  entity: String,       // booking | room | staff | settings | ...
  entityId: String,
  summary: String
});

module.exports = mongoose.model('AuditLog', auditSchema);
