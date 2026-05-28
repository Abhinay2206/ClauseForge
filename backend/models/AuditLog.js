const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  adminUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'signup',
      'logout',
      'document_upload',
      'document_delete',
      'report_download',
      'user_block',
      'user_suspend',
      'user_restore',
      'user_role_change',
      'user_delete',
      'ip_block',
      'ip_unblock',
      'admin_login',
      'document_admin_delete',
    ],
  },
  resource: {
    type: String,
    required: true,
  },
  ipAddress: {
    type: String,
    default: 'unknown'
  },
  details: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
