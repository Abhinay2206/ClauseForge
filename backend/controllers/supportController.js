const Ticket = require('../models/Ticket');
const TicketMessage = require('../models/TicketMessage');
const KnowledgeArticle = require('../models/KnowledgeArticle');
const { logAudit } = require('../services/auditService');
const { categorizeTicket, draftSupportReply } = require('../services/supportAIService');

// @desc    Create a new support ticket
// @route   POST /api/support/tickets
// @access  Public or Private
const createTicket = async (req, res) => {
  try {
    const { title, description, category, priority, email, name, isPublic } = req.body;

    const aiData = await categorizeTicket(description);

    const ticketData = {
      title,
      description,
      category: category || aiData.category,
      priority: priority || aiData.priority,
      aiSummary: aiData.aiSummary,
      isPublic: isPublic || false,
    };

    if (req.user) {
      ticketData.user = req.user._id;
    } else {
      ticketData.email = email;
      ticketData.name = name;
      ticketData.isPublic = true;
    }

    const ticket = await Ticket.create(ticketData);

    // Add initial message
    await TicketMessage.create({
      ticket: ticket._id,
      sender: req.user ? req.user._id : null,
      senderType: req.user ? 'user' : 'public',
      content: description,
    });

    if (req.user) {
      await logAudit(req.user._id, 'ticket_create', 'Ticket', req, { ticketId: ticket._id });
    }

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's tickets
// @route   GET /api/support/tickets/my
// @access  Private (User)
const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user._id }).sort('-createdAt');
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all tickets (Admin/Support)
// @route   GET /api/support/tickets
// @access  Private (Admin/Support)
const getAllTickets = async (req, res) => {
  try {
    const { status, category, priority } = req.query;
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    const tickets = await Ticket.find(query)
      .populate('user', 'name email')
      .populate('assignedTo', 'name')
      .sort('-createdAt');
    
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get ticket by ID with messages
// @route   GET /api/support/tickets/:id
// @access  Private
const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('user', 'name email')
      .populate('assignedTo', 'name');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check permissions
    if (ticket.user && req.user.role === 'user' && ticket.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const messages = await TicketMessage.find({ ticket: ticket._id })
      .populate('sender', 'name role')
      .sort('createdAt');

    // Filter out internal notes for regular users
    const filteredMessages = req.user.role === 'user' 
      ? messages.filter(m => !m.isInternalNote)
      : messages;

    res.json({ ticket, messages: filteredMessages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reply to a ticket
// @route   POST /api/support/tickets/:id/reply
// @access  Private
const replyToTicket = async (req, res) => {
  try {
    const { content, isInternalNote } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const senderType = ['admin', 'moderator', 'support'].includes(req.user.role) ? 'agent' : 'user';

    const message = await TicketMessage.create({
      ticket: ticket._id,
      sender: req.user._id,
      senderType,
      content,
      isInternalNote: isInternalNote || false,
    });

    // Update ticket status
    if (senderType === 'agent' && !isInternalNote) {
      ticket.status = 'waiting_for_response';
    } else if (senderType === 'user') {
      ticket.status = 'open';
    }
    await ticket.save();

    await message.populate('sender', 'name role');
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update ticket status/assignment
// @route   PUT /api/support/tickets/:id
// @access  Private (Admin/Support)
const updateTicket = async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (assignedTo !== undefined) ticket.assignedTo = assignedTo;

    if (status === 'resolved' || status === 'closed') {
      ticket.resolvedAt = new Date();
    }

    await ticket.save();
    
    await logAudit(req.user._id, 'ticket_update', 'Ticket', req, { ticketId: ticket._id });

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Knowledge Base articles
// @route   GET /api/support/kb
// @access  Public
const getKnowledgeArticles = async (req, res) => {
  try {
    const { category, search } = req.query;
    const query = { isPublished: true };
    
    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: 'i' };

    const articles = await KnowledgeArticle.find(query).select('-content -embeddingId').sort('-viewCount');
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single Knowledge Article
// @route   GET /api/support/kb/:slug
// @access  Public
const getKnowledgeArticleBySlug = async (req, res) => {
  try {
    const article = await KnowledgeArticle.findOne({ slug: req.params.slug, isPublished: true });
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Increment view count
    article.viewCount += 1;
    await article.save();

    res.json(article);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Draft an AI response for a ticket
// @route   POST /api/support/tickets/:id/draft
// @access  Private (Support/Admin)
const draftTicketReply = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const messages = await TicketMessage.find({ ticket: ticket._id })
      .populate('sender', 'name role')
      .sort('createdAt');

    const history = messages.map(m => `[${m.senderType.toUpperCase()}] ${m.sender?.name || 'User'}: ${m.content}`).join('\n\n');
    
    const draft = await draftSupportReply(history);
    res.json({ draft });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTicket,
  getMyTickets,
  getAllTickets,
  getTicketById,
  replyToTicket,
  updateTicket,
  getKnowledgeArticles,
  getKnowledgeArticleBySlug,
  draftTicketReply
};
