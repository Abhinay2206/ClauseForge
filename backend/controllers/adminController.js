const User = require('../models/User');
const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');
const { getRedisClient } = require('../utils/redisClient');
const { logAudit } = require('../services/auditService');

const BLOCKED_IPS_KEY = 'cf:blocked_ips';

// ─────────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────────

// @desc    Get all users with pagination and filters
// @route   GET /api/admin/users
// @access  Admin / Moderator / Support
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      role,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    if (status) query.status = status;

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    // Attach document counts
    const userIds = users.map(u => u._id);
    const docCounts = await Document.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: '$user', count: { $sum: 1 } } }
    ]);
    const docCountMap = {};
    docCounts.forEach(d => { docCountMap[d._id.toString()] = d.count; });

    const enriched = users.map(u => ({
      ...u.toObject(),
      documentCount: docCountMap[u._id.toString()] || 0
    }));

    res.json({
      users: enriched,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single user with documents and audit logs
// @route   GET /api/admin/users/:id
// @access  Admin / Moderator / Support
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const [documents, auditLogs] = await Promise.all([
      Document.find({ user: user._id }).sort('-createdAt').limit(50),
      AuditLog.find({ user: user._id }).sort('-createdAt').limit(50)
    ]);

    res.json({ user, documents, auditLogs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user status (block / suspend / restore)
// @route   PATCH /api/admin/users/:id/status
// @access  Admin / Moderator
const updateUserStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const validStatuses = ['active', 'suspended', 'blocked'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Support cannot modify statuses
    if (req.user.role === 'support') {
      return res.status(403).json({ message: 'Support staff cannot modify user status' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent modifying other admins
    if (user.role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Cannot modify an admin account' });
    }

    user.status = status;
    user.suspendedReason = reason || null;
    await user.save();

    const actionMap = { blocked: 'user_block', suspended: 'user_suspend', active: 'user_restore' };
    await logAudit(req.user._id, actionMap[status], 'User', req, {
      targetUserId: user._id,
      reason
    });

    res.json({ message: `User ${status} successfully`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user role
// @route   PATCH /api/admin/users/:id/role
// @access  Admin only
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['user', 'admin', 'moderator', 'support'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role value' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const previousRole = user.role;
    user.role = role;
    await user.save();

    await logAudit(req.user._id, 'user_role_change', 'User', req, {
      targetUserId: user._id,
      previousRole,
      newRole: role
    });

    res.json({ message: 'User role updated', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user and all their documents
// @route   DELETE /api/admin/users/:id
// @access  Admin only
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete an admin account' });
    }

    await Document.deleteMany({ user: user._id });
    await AuditLog.deleteMany({ user: user._id });
    await User.findByIdAndDelete(user._id);

    await logAudit(req.user._id, 'user_delete', 'User', req, {
      targetUserId: user._id,
      targetEmail: user.email
    });

    res.json({ message: 'User and all associated data deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// DOCUMENT MANAGEMENT
// ─────────────────────────────────────────────

// @desc    Get all documents (admin view)
// @route   GET /api/admin/documents
// @access  Admin / Moderator / Support
const getAllDocuments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status,
      riskLevel,
      userId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (status) query.status = status;
    if (riskLevel) query.riskLevel = riskLevel;
    if (userId) query.user = userId;

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [documents, total] = await Promise.all([
      Document.find(query)
        .populate('user', 'name email role')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-clauses -fullAiReport'),
      Document.countDocuments(query)
    ]);

    // Total storage
    const storageResult = await Document.aggregate([
      { $group: { _id: null, totalSize: { $sum: '$size' } } }
    ]);
    const totalStorage = storageResult[0]?.totalSize || 0;

    res.json({
      documents,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      totalStorage
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin delete document
// @route   DELETE /api/admin/documents/:id
// @access  Admin / Moderator
const adminDeleteDocument = async (req, res) => {
  try {
    if (req.user.role === 'support') {
      return res.status(403).json({ message: 'Support staff cannot delete documents' });
    }

    const doc = await Document.findById(req.params.id).populate('user', 'name email');
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    await Document.findByIdAndDelete(doc._id);

    await logAudit(req.user._id, 'document_admin_delete', 'Document', req, {
      documentId: doc._id,
      documentName: doc.name,
      ownerId: doc.user?._id,
      ownerEmail: doc.user?.email
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// AUDIT LOGS
// ─────────────────────────────────────────────

// @desc    Get paginated audit logs
// @route   GET /api/admin/audit-logs
// @access  Admin / Moderator / Support
const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 30,
      action,
      userId,
      ipAddress,
      startDate,
      endDate
    } = req.query;

    const query = {};
    if (action) query.action = action;
    if (userId) query.user = userId;
    if (ipAddress) query.ipAddress = ipAddress;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('user', 'name email role')
        .populate('adminUser', 'name email')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      AuditLog.countDocuments(query)
    ]);

    res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────

// @desc    Platform overview stats
// @route   GET /api/admin/analytics/overview
// @access  Admin / Moderator / Support
const getAnalyticsOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      totalDocuments,
      storageResult,
      usersByRole,
      docsByStatus,
      docsByRisk,
      recentLogins
    ] = await Promise.all([
      User.countDocuments(),
      Document.countDocuments(),
      Document.aggregate([{ $group: { _id: null, total: { $sum: '$size' } } }]),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Document.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Document.aggregate([{ $match: { riskLevel: { $ne: null } } }, { $group: { _id: '$riskLevel', count: { $sum: 1 } } }]),
      AuditLog.countDocuments({
        action: 'login',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
    ]);

    res.json({
      totalUsers,
      totalDocuments,
      totalStorageBytes: storageResult[0]?.total || 0,
      recentLogins,
      usersByRole: usersByRole.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {}),
      docsByStatus: docsByStatus.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {}),
      docsByRisk: docsByRisk.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {})
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Activity time-series (uploads + logins per day, last 30 days)
// @route   GET /api/admin/analytics/activity
// @access  Admin / Moderator / Support
const getActivityTimeseries = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [uploads, logins] = await Promise.all([
      Document.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      AuditLog.aggregate([
        { $match: { action: 'login', createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({ uploads, logins });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Risk distribution and top clause types across all documents
// @route   GET /api/admin/analytics/risk
// @access  Admin / Moderator / Support
const getRiskAnalytics = async (req, res) => {
  try {
    const [riskDist, clauseTypes, topUsers] = await Promise.all([
      Document.aggregate([
        { $match: { riskLevel: { $ne: null } } },
        { $group: { _id: '$riskLevel', count: { $sum: 1 }, avgScore: { $avg: '$overallRiskScore' } } }
      ]),
      Document.aggregate([
        { $unwind: '$clauses' },
        { $group: { _id: '$clauses.type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Document.aggregate([
        { $group: { _id: '$user', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            count: 1,
            name: '$userInfo.name',
            email: '$userInfo.email'
          }
        }
      ])
    ]);

    res.json({ riskDist, clauseTypes, topUsers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// IP MANAGEMENT
// ─────────────────────────────────────────────

// @desc    Get all blocked IPs
// @route   GET /api/admin/ip/blocked
// @access  Admin / Moderator / Support
const getBlockedIPs = async (req, res) => {
  try {
    const client = getRedisClient();
    const data = await client.hgetall(BLOCKED_IPS_KEY);

    const blocked = data
      ? Object.entries(data).map(([ip, raw]) => {
          try {
            const parsed = JSON.parse(raw);
            return { ip, ...parsed };
          } catch {
            return { ip, reason: raw, blockedAt: null };
          }
        })
      : [];

    res.json({ blocked });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Block an IP address
// @route   POST /api/admin/ip/block
// @access  Admin / Moderator
const blockIPAddress = async (req, res) => {
  try {
    if (req.user.role === 'support') {
      return res.status(403).json({ message: 'Support staff cannot block IPs' });
    }

    const { ip, reason = 'Manual block by admin' } = req.body;
    if (!ip) return res.status(400).json({ message: 'IP address is required' });

    const client = getRedisClient();
    const payload = JSON.stringify({
      reason,
      blockedAt: new Date().toISOString(),
      blockedBy: req.user._id
    });
    await client.hset(BLOCKED_IPS_KEY, ip, payload);

    await logAudit(req.user._id, 'ip_block', 'IPAddress', req, { ip, reason });

    res.json({ message: `IP ${ip} blocked successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unblock an IP address
// @route   DELETE /api/admin/ip/unblock/:ip
// @access  Admin / Moderator
const unblockIPAddress = async (req, res) => {
  try {
    if (req.user.role === 'support') {
      return res.status(403).json({ message: 'Support staff cannot unblock IPs' });
    }

    const ip = decodeURIComponent(req.params.ip);
    const client = getRedisClient();
    await client.hdel(BLOCKED_IPS_KEY, ip);

    await logAudit(req.user._id, 'ip_unblock', 'IPAddress', req, { ip });

    res.json({ message: `IP ${ip} unblocked successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// SYSTEM HEALTH
// ─────────────────────────────────────────────

// @desc    System health status
// @route   GET /api/admin/system/health
// @access  Admin / Moderator / Support
const getSystemHealth = async (req, res) => {
  try {
    const client = getRedisClient();

    // MongoDB health
    const mongoose = require('mongoose');
    const mongoStatus = mongoose.connection.readyState; // 1 = connected
    const mongoConnected = mongoStatus === 1;

    // Redis health
    let redisConnected = false;
    let redisPing = null;
    try {
      const start = Date.now();
      await client.ping();
      redisPing = Date.now() - start;
      redisConnected = true;
    } catch {}

    // Queue depth from BullMQ
    let queueDepth = 0;
    try {
      const { Queue } = require('bullmq');
      const q = new Queue('document-processing', { connection: client });
      const waiting = await q.getWaitingCount();
      const active = await q.getActiveCount();
      queueDepth = waiting + active;
      await q.close();
    } catch {}

    // AI microservice health
    let aiHealthy = false;
    try {
      const axios = require('axios');
      const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      await axios.get(`${aiUrl}/health`, { timeout: 3000 });
      aiHealthy = true;
    } catch {}

    res.json({
      mongodb: { connected: mongoConnected, readyState: mongoStatus },
      redis: { connected: redisConnected, pingMs: redisPing },
      queue: { depth: queueDepth },
      aiService: { healthy: aiHealthy },
      server: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
      },
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Redis stats
// @route   GET /api/admin/system/redis-stats
// @access  Admin / Moderator / Support
const getRedisStats = async (req, res) => {
  try {
    const client = getRedisClient();
    const info = await client.info();

    // Parse Redis INFO output
    const lines = info.split('\r\n');
    const stats = {};
    lines.forEach(line => {
      const [key, val] = line.split(':');
      if (key && val !== undefined) stats[key.trim()] = val.trim();
    });

    const dbKeys = await client.dbsize();

    res.json({
      usedMemory: stats['used_memory_human'] || 'N/A',
      usedMemoryPeak: stats['used_memory_peak_human'] || 'N/A',
      connectedClients: parseInt(stats['connected_clients']) || 0,
      totalCommandsProcessed: parseInt(stats['total_commands_processed']) || 0,
      keyspaceHits: parseInt(stats['keyspace_hits']) || 0,
      keyspaceMisses: parseInt(stats['keyspace_misses']) || 0,
      totalKeys: dbKeys,
      uptimeSeconds: parseInt(stats['uptime_in_seconds']) || 0,
      redisVersion: stats['redis_version'] || 'N/A',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  // Users
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  // Documents
  getAllDocuments,
  adminDeleteDocument,
  // Audit Logs
  getAuditLogs,
  // Analytics
  getAnalyticsOverview,
  getActivityTimeseries,
  getRiskAnalytics,
  // IP Management
  getBlockedIPs,
  blockIPAddress,
  unblockIPAddress,
  // System
  getSystemHealth,
  getRedisStats
};
