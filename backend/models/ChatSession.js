const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  title: {
    type: String,
    default: 'New Chat'
  }
}, { timestamps: true });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
