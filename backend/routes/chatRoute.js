const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const chatController = require('../controllers/chatController');

router.use(protect);

router.get('/sessions', chatController.getSessions);
router.post('/sessions', chatController.createSession);
router.get('/sessions/:id', chatController.getSession);
router.post('/stream', chatController.streamChat);

module.exports = router;
