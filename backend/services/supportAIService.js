const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');

// Check if OpenAI key exists
const hasOpenAI = !!process.env.OPENAI_API_KEY;

let llm;
if (hasOpenAI) {
  llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.2,
    modelName: 'gpt-4o-mini',
  });
}

/**
 * Categorize a support ticket automatically.
 * Returns a category, priority, and summary.
 */
const categorizeTicket = async (description) => {
  if (!hasOpenAI || !llm) {
    return {
      category: 'general_inquiry',
      priority: 'normal',
      aiSummary: 'AI analysis unavailable.',
    };
  }

  try {
    const prompt = PromptTemplate.fromTemplate(`
      You are an expert IT/SaaS Support Triage AI for a Legal Tech platform.
      Analyze the following user support ticket description.

      Ticket Description:
      "{description}"

      Extract the following information:
      1. Category: Choose one of [billing, technical_support, ai_analysis_issues, document_processing_issues, compliance_support, account_recovery, feature_requests, bug_reports, general_inquiry]
      2. Priority: Choose one of [low, normal, high, urgent]
      3. Summary: A concise 1-sentence summary of the user's issue.

      Return ONLY a valid JSON object with keys "category", "priority", and "aiSummary".
    `);

    const chain = prompt.pipe(llm);
    const response = await chain.invoke({ description });
    
    try {
      // Parse JSON from text
      const cleanText = response.content.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      return {
        category: parsed.category || 'general_inquiry',
        priority: parsed.priority || 'normal',
        aiSummary: parsed.aiSummary || 'Summary not generated.',
      };
    } catch (parseError) {
      console.error('Failed to parse AI classification JSON:', parseError);
      return { category: 'general_inquiry', priority: 'normal', aiSummary: 'Could not parse summary.' };
    }
  } catch (error) {
    console.error('Failed to categorize ticket via AI:', error);
    return { category: 'general_inquiry', priority: 'normal', aiSummary: 'AI Categorization failed.' };
  }
};

/**
 * Draft a professional reply for a support agent based on the ticket history.
 */
const draftSupportReply = async (ticketHistory) => {
  if (!hasOpenAI || !llm) {
    return 'AI Assistant is currently unavailable. Please draft a reply manually.';
  }

  try {
    const prompt = PromptTemplate.fromTemplate(`
      You are an expert Customer Support Agent for a Legal Tech platform.
      Draft a professional, empathetic, and helpful response to the user based on the following ticket history.
      Do not include placeholders for names if you don't know them, just use generic professional greetings.

      Ticket History:
      {history}

      Draft the reply:
    `);

    const chain = prompt.pipe(llm);
    const response = await chain.invoke({ history: ticketHistory });
    return response.content.trim();
  } catch (error) {
    console.error('Failed to draft support reply via AI:', error);
    return 'Failed to generate a draft. Please try again later.';
  }
};

module.exports = {
  categorizeTicket,
  draftSupportReply,
};
