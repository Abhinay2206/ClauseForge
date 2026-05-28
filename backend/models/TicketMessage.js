const mongoose = require('mongoose');

const ticketMessageSchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Could be unauthenticated public user or AI
  },
  senderType: {
    type: String,
    enum: ['user', 'agent', 'system', 'ai', 'public'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  isInternalNote: {
    type: Boolean,
    default: false, // True if the message is only visible to support staff
  },
  attachments: [{
    filename: String,
    url: String, // S3 URL
    mimeType: String,
  }],
  aiGenerated: {
    type: Boolean,
    default: false, // True if the message was drafted by the AI assistant
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, { timestamps: true });

ticketMessageSchema.index({ ticket: 1, createdAt: 1 });

module.exports = mongoose.model('TicketMessage', ticketMessageSchema);
