const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
    default: null
  },
  password: {
    type: String,
    required: function() { return !this.googleId; }
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator', 'support'],
    default: 'user'
  },
  emailPreferences: {
    marketing: { type: Boolean, default: true },
    reports: { type: Boolean, default: true },
    alerts: { type: Boolean, default: true }
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'blocked'],
    default: 'active'
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  loginCount: {
    type: Number,
    default: 0
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  suspendedReason: {
    type: String,
    default: null
  },
  lastIpAddress: {
    type: String,
    default: null
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
