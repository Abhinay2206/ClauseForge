const mongoose = require('mongoose');

const knowledgeArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  content: {
    type: String, // Markdown or HTML
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isPublished: {
    type: Boolean,
    default: true,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  helpfulVotes: {
    type: Number,
    default: 0,
  },
  unhelpfulVotes: {
    type: Number,
    default: 0,
  },
  embeddingId: {
    type: String, // ID linking this to ChromaDB for RAG search
  }
}, { timestamps: true });

knowledgeArticleSchema.index({ category: 1 });

module.exports = mongoose.model('KnowledgeArticle', knowledgeArticleSchema);
