const User = require('../models/User');

/**
 * Tracks AI LLM token usage for a specific user.
 * Increments the user's aiUsage fields.
 * 
 * @param {string} userId - The user's ID
 * @param {Object} usage - The usage object returned from the AI Microservice
 * @param {number} usage.prompt_tokens - Number of prompt tokens
 * @param {number} usage.completion_tokens - Number of completion tokens
 * @param {number} usage.total_tokens - Total tokens used
 */
const trackAiUsage = async (userId, usage) => {
  if (!userId || !usage) return;
  
  try {
    await User.findByIdAndUpdate(userId, {
      $inc: {
        'aiUsage.calls': 1,
        'aiUsage.promptTokens': usage.prompt_tokens || 0,
        'aiUsage.completionTokens': usage.completion_tokens || 0,
        'aiUsage.totalTokens': usage.total_tokens || 0
      }
    });
  } catch (error) {
    console.error('Error tracking AI usage:', error);
  }
};

module.exports = {
  trackAiUsage
};
