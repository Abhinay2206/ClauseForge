const mongoose = require('mongoose');

const clauseSchema = new mongoose.Schema({
  clauseId: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  confidence: {
    type: Number,
    required: true
  },
  riskConfidence: {
    type: Number,
    required: true
  },
  explanation: {
    type: String,
    default: ''
  },
  startIndex: {
    type: Number,
    default: 0
  },
  endIndex: {
    type: Number,
    default: 0
  }
}, { _id: false });

const documentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  s3Key: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'analyzing', 'completed', 'failed', 'unanalyzed'],
    default: 'pending'
  },
  // AI Analysis Results
  overallRiskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: null
  },
  summary: {
    type: String,
    default: null
  },
  fullAiReport: {
    type: String,
    default: null
  },
  clauses: {
    type: [clauseSchema],
    default: []
  },
  totalChunks: {
    type: Number,
    default: 0
  },
  negotiationSuggestions: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  actionItems: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
