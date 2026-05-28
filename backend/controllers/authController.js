const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { logAudit } = require('../services/auditService');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const { enqueueEmail } = require('../queues/emailQueue');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password
    });

    if (user) {
      const token = generateToken(user._id);
      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
      
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      });

      // Audit Log
      await logAudit(user._id, 'signup', 'UserAccount', req);
      
      // Send welcome email
      if (user.emailPreferences?.marketing !== false) {
        await enqueueEmail('welcome', user.email, 'Welcome to ClauseForge', {
          name: user.name,
          dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`,
          userId: user._id
        });
      }

    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      // Check if user is blocked or suspended
      if (user.status === 'blocked') {
        return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
      }
      if (user.status === 'suspended') {
        return res.status(403).json({ message: `Your account is suspended. Reason: ${user.suspendedReason || 'Please contact support.'}` });
      }

      const token = generateToken(user._id);
      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      // Update login tracking
      let clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
      if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
          clientIp = '127.0.0.1';
      }
      
      user.lastLoginAt = new Date();
      user.loginCount = (user.loginCount || 0) + 1;
      user.failedLoginAttempts = 0;
      user.lastIpAddress = clientIp;
      await user.save();

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
        lastIpAddress: user.lastIpAddress
      });

      // Audit Log
      await logAudit(user._id, 'login', 'UserSession', req);

    } else {
      // Track failed login attempts
      if (user) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        await user.save();
      }
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.name = req.body.name || user.name;
      if (req.body.email && req.body.email !== user.email) {
        // Check if new email is already in use
        const emailExists = await User.findOne({ email: req.body.email });
        if (emailExists) {
          return res.status(400).json({ message: 'Email is already in use' });
        }
        user.email = req.body.email;
      }

      const updatedUser = await user.save();
      await logAudit(updatedUser._id, 'update_profile', 'UserAccount', req);

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        lastLoginAt: updatedUser.lastLoginAt,
        lastIpAddress: updatedUser.lastIpAddress
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change user password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if current password is correct
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ message: 'Incorrect current password' });
    }

    user.password = newPassword;
    await user.save();

    await logAudit(user._id, 'change_password', 'UserAccount', req);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Authenticate with Google
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
  const { credential, accessToken } = req.body;

  try {
    let email, name, googleId;

    if (credential) {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      googleId = payload.sub;
    } else if (accessToken) {
      const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      email = response.data.email;
      name = response.data.name;
      googleId = response.data.sub;
    } else {
      return res.status(400).json({ message: 'No credential or access token provided' });
    }

    let user = await User.findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }

      if (user.status === 'blocked') {
        return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
      }
      if (user.status === 'suspended') {
        return res.status(403).json({ message: `Your account is suspended. Reason: ${user.suspendedReason || 'Please contact support.'}` });
      }

      // Update login tracking
      let clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
      if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') clientIp = '127.0.0.1';
      
      user.lastLoginAt = new Date();
      user.loginCount = (user.loginCount || 0) + 1;
      user.lastIpAddress = clientIp;
      await user.save();

      await logAudit(user._id, 'login', 'UserSession', req, { method: 'google' });

    } else {
      user = await User.create({
        name,
        email,
        googleId,
        password: '', // will be ignored or bypassed due to schema update
      });
      await logAudit(user._id, 'signup', 'UserAccount', req, { method: 'google' });
      
      // Send welcome email
      if (user.emailPreferences?.marketing !== false) {
        await enqueueEmail('welcome', user.email, 'Welcome to ClauseForge', {
          name: user.name,
          dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`,
          userId: user._id
        });
      }
    }

    const token = generateToken(user._id);
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      lastIpAddress: user.lastIpAddress
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Failed to authenticate with Google' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  googleLogin,
  updateProfile,
  changePassword
};
