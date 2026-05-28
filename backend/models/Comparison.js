const mongoose = require('mongoose');

const clauseComparisonSchema = new mongoose.Schema({
  clause_type: {
    type: String,
    required: true
  },
  text_a: {
    type: String,
    required: true
  },
  text_b: {
    type: String,
    required: true
  },
  relationship: {
    type: String,
    enum: ['similar', 'conflicting', 'unrelated'],
    required: true
  },
  confidence: {
    type: Number,
    required: true
  },
  explanation: {
    type: String,
    default: ''
  }
}, { _id: false });

const comparisonSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documentA: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
    name: { type: String, required: true }
  },
  documentB: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
    name: { type: String, required: true }
  },
  similarity: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  changes: {
    type: Number,
    required: true,
    default: 0
  },
  summary: {
    type: String,
    default: ''
  },
  clauseComparisons: {
    type: [clauseComparisonSchema],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('Comparison', comparisonSchema);
