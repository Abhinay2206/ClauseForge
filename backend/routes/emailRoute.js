const express = require('express');
const router = express.Router();
const { updatePreferences, getPreferences, getEmailLogs, sendBroadcast } = require('../controllers/emailController');
const { protect, authorize } = require('../middleware/auth');

router.get('/preferences', protect, getPreferences);
router.put('/preferences', protect, updatePreferences);

router.get('/logs', protect, authorize('admin', 'moderator'), getEmailLogs);
router.post('/broadcast', protect, authorize('admin', 'moderator'), sendBroadcast);

module.exports = router;
