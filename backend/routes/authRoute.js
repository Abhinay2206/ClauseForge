const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logoutUser, getMe, googleLogin, updateProfile, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);

module.exports = router;
