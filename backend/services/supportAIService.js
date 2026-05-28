const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const normalizeTriage = (data = {}) => ({
  category: data.category || 'general_inquiry',
  priority: data.priority || 'normal',
  aiSummary: data.aiSummary || 'Summary not generated.',
});

/**
 * Categorize a support ticket through the backend LLaMA/Groq AI microservice.
 */
const categorizeTicket = async (description) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/support/categorize`, {
      description,
    }, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    return normalizeTriage(response.data);
  } catch (error) {
    console.error('Failed to categorize ticket via LLaMA service:', error.message);
    return {
      category: 'general_inquiry',
      priority: 'normal',
      aiSummary: 'LLaMA support analysis unavailable.',
    };
  }
};

/**
 * Draft a professional reply through the backend LLaMA/Groq AI microservice.
 */
const draftSupportReply = async (ticketHistory) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/support/draft`, {
      history: ticketHistory,
    }, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    return response.data?.draft?.trim() || 'No draft generated.';
  } catch (error) {
    console.error('Failed to draft support reply via LLaMA service:', error.message);
    return 'LLaMA support assistant is currently unavailable. Please draft a reply manually.';
  }
};

module.exports = {
  categorizeTicket,
  draftSupportReply,
};
