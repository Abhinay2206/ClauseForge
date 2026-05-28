const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Call the FastAPI AI microservice to analyze a document.
 * 
 * The AI service:
 * 1. Fetches document chunks from ChromaDB (direct metadata filter, no RAG search)
 * 2. Runs each chunk through the clause detector model (13 clause types)
 * 3. Runs each chunk through the risk analysis model (low/medium/high)
 * 4. Returns structured analysis with clauses, risk scores, and summary
 * 
 * @param {string} documentId - MongoDB document ID
 * @returns {Object} Analysis results from FastAPI
 */
const analyzeDocument = async (documentId) => {
  try {
    console.log(`Calling AI service for document ${documentId}...`);

    const response = await axios.post(`${AI_SERVICE_URL}/api/analyze`, {
      document_id: documentId,
    }, {
      timeout: 120000, // 2 minute timeout for model inference
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`AI analysis complete for ${documentId}: ${response.data.clauses.length} clauses, risk score ${response.data.overall_risk_score}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(`AI service error (${error.response.status}):`, error.response.data);
      throw new Error(`AI analysis failed: ${error.response.data.detail || error.response.statusText}`);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('AI service is not running. Start it with: cd ai_microservices && uvicorn main:app --reload --port 8000');
      throw new Error('AI service is unavailable. Please ensure the FastAPI server is running on port 8000.');
    } else {
      console.error('AI service request failed:', error.message);
      throw error;
    }
  }
};

/**
 * Check if the AI service is healthy.
 * @returns {Object} Health status from FastAPI
 */
const checkAIHealth = async () => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 5000 });
    return response.data;
  } catch (error) {
    return { status: 'unavailable', models_loaded: false, chroma_connected: false };
  }
};

module.exports = {
  analyzeDocument,
  checkAIHealth,
};

/**
 * Call the FastAPI AI microservice to compare two documents.
 * 
 * @param {Array} clausesA - Clauses from document A
 * @param {Array} clausesB - Clauses from document B
 * @returns {Object} Comparison results from FastAPI
 */
const compareDocumentsAI = async (clausesA, clausesB) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/compare`, {
      clauses_a: clausesA,
      clauses_b: clausesB,
    }, {
      timeout: 120000,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`AI comparison failed: ${error.response.data.detail || error.response.statusText}`);
    }
    throw error;
  }
};

module.exports.compareDocumentsAI = compareDocumentsAI;

/**
 * Call the FastAPI AI microservice to summarize standard text diff.
 * 
 * @param {string} diffText - Raw text diff string
 * @returns {Object} Comparison text summary from FastAPI
 */
const summarizeTextDiffAI = async (diffText) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/compare_text`, {
      diff_text: diffText,
    }, {
      timeout: 120000,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`AI text comparison failed: ${error.response.data.detail || error.response.statusText}`);
    }
    throw error;
  }
};

module.exports.summarizeTextDiffAI = summarizeTextDiffAI;

/**
 * Call the FastAPI AI microservice to explain a specific clause.
 * 
 * @param {string} text - Clause text
 * @param {string} type - Clause type
 * @param {string} riskLevel - Clause risk level
 * @returns {Object} Explanation result from FastAPI
 */
const explainClauseAI = async (text, type, riskLevel) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/explain_clause`, {
      text,
      type,
      risk_level: riskLevel,
    }, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`AI explanation failed: ${error.response.data.detail || error.response.statusText}`);
    }
  }
};

module.exports.explainClauseAI = explainClauseAI;

/**
 * Call the FastAPI AI microservice to generate a full document report.
 * 
 * @param {Array} clauses - All detected clauses
 * @param {number} riskScore - Overall risk score
 * @param {string} riskLevel - Overall risk level
 * @returns {Object} Report from FastAPI
 */
const explainDocumentAI = async (clauses, riskScore, riskLevel) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/explain_document`, {
      clauses,
      risk_score: riskScore,
      risk_level: riskLevel,
    }, {
      timeout: 120000,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`AI document explanation failed: ${error.response.data.detail || error.response.statusText}`);
    }
    throw error;
  }
};

module.exports.explainDocumentAI = explainDocumentAI;

/**
 * Call the FastAPI AI microservice to generate negotiation suggestions.
 * 
 * @param {Array} clauses - Clauses to negotiate
 * @returns {Object} Negotiation suggestions from FastAPI
 */
const getNegotiationSuggestionsAI = async (clauses) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/negotiate`, {
      clauses,
    }, {
      timeout: 120000,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`AI negotiation failed: ${error.response.data.detail || error.response.statusText}`);
    }
    throw error;
  }
};

module.exports.getNegotiationSuggestionsAI = getNegotiationSuggestionsAI;

/**
 * Call the FastAPI AI microservice to extract action items.
 * 
 * @param {Array} clauses - Clauses to extract from
 * @returns {Object} Action items from FastAPI
 */
const getActionItemsAI = async (clauses) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/action_items`, {
      clauses,
    }, {
      timeout: 120000,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`AI action items failed: ${error.response.data.detail || error.response.statusText}`);
    }
    throw error;
  }
};

module.exports.getActionItemsAI = getActionItemsAI;
