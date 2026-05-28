const express = require('express');
const router = express.Router();
const { 
  createTicket, 
  getMyTickets, 
  getAllTickets, 
  getTicketById, 
  replyToTicket, 
  updateTicket, 
  getKnowledgeArticles, 
  getKnowledgeArticleBySlug,
  draftTicketReply
} = require('../controllers/supportController');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// Help Center (Public)
router.get('/kb', getKnowledgeArticles);
router.get('/kb/:slug', getKnowledgeArticleBySlug);

// Public/Private Ticket Creation
// Rate limited heavily for public users to prevent spam
router.post('/tickets', optionalAuth, apiLimiter, createTicket);

// User Tickets
router.get('/tickets/my', protect, getMyTickets);

// Shared Ticket Access (User fetching their own, Admin fetching any)
router.get('/tickets/:id', protect, getTicketById);
router.post('/tickets/:id/reply', protect, replyToTicket);

// Admin / Support Staff Routes
router.get('/tickets', protect, authorize('admin', 'moderator', 'support'), getAllTickets);
router.put('/tickets/:id', protect, authorize('admin', 'moderator', 'support'), updateTicket);
router.post('/tickets/:id/draft', protect, authorize('admin', 'moderator', 'support'), draftTicketReply);

module.exports = router;
