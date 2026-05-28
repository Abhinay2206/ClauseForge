const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireAdmin, requireFullAdmin } = require('../middleware/requireAdmin');
const {
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getAllDocuments,
  adminDeleteDocument,
  getAuditLogs,
  getAnalyticsOverview,
  getActivityTimeseries,
  getRiskAnalytics,
  getBlockedIPs,
  blockIPAddress,
  unblockIPAddress,
  getSystemHealth,
  getRedisStats,
  getDLQJobs
} = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(protect, requireAdmin);

// ── Users ──────────────────────────────────
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/users/:id/role', requireFullAdmin, updateUserRole);
router.delete('/users/:id', requireFullAdmin, deleteUser);

// ── Documents ──────────────────────────────
router.get('/documents', getAllDocuments);
router.delete('/documents/:id', adminDeleteDocument);

// ── Audit Logs ─────────────────────────────
router.get('/audit-logs', getAuditLogs);

// ── Analytics ──────────────────────────────
router.get('/analytics/overview', getAnalyticsOverview);
router.get('/analytics/activity', getActivityTimeseries);
router.get('/analytics/risk', getRiskAnalytics);

// ── IP Management ──────────────────────────
router.get('/ip/blocked', getBlockedIPs);
router.post('/ip/block', blockIPAddress);
router.delete('/ip/unblock/:ip', unblockIPAddress);

// ── System Health ──────────────────────────
router.get('/system/health', getSystemHealth);
router.get('/system/redis-stats', getRedisStats);
router.get('/system/dlq', getDLQJobs);

module.exports = router;
