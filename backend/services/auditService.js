const AuditLog = require('../models/AuditLog');

const logAudit = async (userId, action, resource, req, details = {}) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    
    await AuditLog.create({
      user: userId,
      action,
      resource,
      ipAddress,
      details
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};

module.exports = {
  logAudit
};
