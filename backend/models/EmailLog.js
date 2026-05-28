const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  recipient: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  templateType: {
    type: String,
    enum: ['report', 'alert', 'welcome', 'newsletter'],
    required: true,
  },
  status: {
    type: String,
    enum: ['queued', 'sent', 'delivered', 'failed'],
    default: 'queued',
  },
  provider: {
    type: String,
    enum: ['resend', 'nodemailer', 'none'],
    default: 'none',
  },
  providerMessageId: {
    type: String,
  },
  errorMessage: {
    type: String,
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  opens: {
    type: Number,
    default: 0,
  },
  clicks: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('EmailLog', emailLogSchema);
