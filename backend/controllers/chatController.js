const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const Document = require('../models/Document');
const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

exports.getSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sessions', error: error.message });
  }
};

exports.getSession = async (req, res) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    
    const messages = await ChatMessage.find({ sessionId: session._id }).sort({ createdAt: 1 });
    res.status(200).json({ session, messages });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch session', error: error.message });
  }
};

exports.createSession = async (req, res) => {
  try {
    const { documentIds, title } = req.body;
    const session = await ChatSession.create({
      userId: req.user._id,
      documentIds: documentIds || [],
      title: title || 'New Chat'
    });
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create session', error: error.message });
  }
};

exports.streamChat = async (req, res) => {
  try {
    const { sessionId, content, documentIds } = req.body;

    let session;
    if (sessionId) {
      session = await ChatSession.findOne({ _id: sessionId, userId: req.user._id });
      if (!session) return res.status(404).json({ message: 'Session not found' });
    } else {
      // Create new session if not provided
      session = await ChatSession.create({
        userId: req.user._id,
        documentIds: documentIds || [],
        title: content.substring(0, 30) + (content.length > 30 ? '...' : '')
      });
    }

    // Save user message
    await ChatMessage.create({
      sessionId: session._id,
      role: 'user',
      content: content
    });

    // Fetch previous messages for context
    const previousMessages = await ChatMessage.find({ sessionId: session._id }).sort({ createdAt: 1 });
    const formattedHistory = previousMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Setup SSE Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    
    // First event with session ID
    res.write(`data: ${JSON.stringify({ type: 'session_info', sessionId: session._id })}\n\n`);

    // Call Python Microservice
    try {
      const aiResponse = await axios({
        method: 'post',
        url: `${AI_SERVICE_URL}/api/chat/stream`,
        data: {
          messages: formattedHistory,
          document_ids: session.documentIds
        },
        responseType: 'stream',
        headers: { 'Accept': 'text/event-stream' }
      });

      let fullAssistantMessage = "";
      
      aiResponse.data.on('data', (chunk) => {
        // Forward chunks to frontend
        const str = chunk.toString();
        // Just forward the raw SSE data from python which will be 'data: {...}\n\n'
        res.write(str);
        
        // Extract content to save to DB later
        const lines = str.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.type === 'content' && data.content) {
                fullAssistantMessage += data.content;
              }
            } catch (e) {
              // Ignore parse errors on partial chunks if any
            }
          }
        }
      });

      aiResponse.data.on('end', async () => {
        // Save assistant message to DB
        if (fullAssistantMessage) {
          await ChatMessage.create({
            sessionId: session._id,
            role: 'assistant',
            content: fullAssistantMessage
          });
        }
        res.write('data: [DONE]\n\n');
        res.end();
      });

      aiResponse.data.on('error', (err) => {
        console.error('Stream error from AI service:', err);
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'Stream interrupted' })}\n\n`);
        res.end();
      });

    } catch (aiError) {
      console.error('Failed to connect to AI service:', aiError.message);
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'AI service unavailable' })}\n\n`);
      res.end();
    }
    
  } catch (error) {
    console.error('Chat error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to process chat', error: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Internal server error' })}\n\n`);
      res.end();
    }
  }
};
