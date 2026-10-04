const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  admin: { type: String, default: 'Admin' },
  action: { type: String, required: true },
  recordId: { type: String, default: 'System' },
  previousStatus: { type: String, default: '' },
  newStatus: { type: String, default: '' },
  reason: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
