const User = require('../models/User');
const EmailLog = require('../models/EmailLog');
const { enqueueEmail } = require('../queues/emailQueue');

// @desc    Update user email preferences
// @route   PUT /api/email/preferences
// @access  Private
const updatePreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.emailPreferences = {
      ...user.emailPreferences,
      ...req.body
    };

    await user.save();
    res.json(user.emailPreferences);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user email preferences
// @route   GET /api/email/preferences
// @access  Private
const getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.emailPreferences || { marketing: true, reports: true, alerts: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get email logs (Admin only)
// @route   GET /api/email/logs
// @access  Private/Admin
const getEmailLogs = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const logs = await EmailLog.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await EmailLog.countDocuments();

    res.json({
      logs,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send test/broadcast email (Admin only)
// @route   POST /api/email/broadcast
// @access  Private/Admin
const sendBroadcast = async (req, res) => {
  const { to, subject, message } = req.body;
  try {
    // using 'alert' template as a generic one for broadcasts
    await enqueueEmail('alert', to, subject, {
      name: 'User',
      message,
      actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`
    });
    res.json({ message: 'Email queued successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  updatePreferences,
  getPreferences,
  getEmailLogs,
  sendBroadcast
};
