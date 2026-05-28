const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // public users might not be authenticated
  },
  email: {
    type: String, // fallback for public tickets
    required: function() { return !this.user; },
  },
  name: {
    type: String, // fallback for public tickets
    required: function() { return !this.user; },
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['open', 'pending', 'in_progress', 'waiting_for_response', 'escalated', 'resolved', 'closed'],
    default: 'open',
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  category: {
    type: String,
    enum: [
      'billing', 
      'technical_support', 
      'ai_analysis_issues', 
      'document_processing_issues', 
      'compliance_support', 
      'account_recovery', 
      'feature_requests', 
      'bug_reports',
      'general_inquiry'
    ],
    default: 'general_inquiry',
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  aiSummary: {
    type: String,
  },
  slaBreachAt: {
    type: Date,
  },
  resolvedAt: {
    type: Date,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed, // e.g. documentId, device info
  }
}, { timestamps: true });

ticketSchema.index({ status: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ user: 1 });
ticketSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
