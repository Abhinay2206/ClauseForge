const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const pdf = require('pdf-parse');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');
const Document = require('../models/Document');
const Comparison = require('../models/Comparison');
const { invalidateCache } = require('../middleware/cache');
const { logAudit } = require('../services/auditService');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

// @desc    Get presigned URL for S3 upload
// @route   GET /api/documents/upload-url
// @access  Private
const getUploadUrl = async (req, res) => {
  try {
    const { filename, filetype } = req.query;

    if (!filename || !filetype) {
      return res.status(400).json({ message: 'Filename and filetype are required' });
    }

    const fileExtension = filename.split('.').pop();
    const uniqueKey = `${req.user._id}/${crypto.randomBytes(16).toString('hex')}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: uniqueKey,
      ContentType: filetype,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res.json({ uploadUrl, key: uniqueKey });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register new uploaded document
// @route   POST /api/documents
// @access  Private
const registerDocument = async (req, res) => {
  try {
    const { name, s3Key, type, size, skipAnalysis } = req.body;

    const document = await Document.create({
      user: req.user._id,
      name,
      s3Key,
      type,
      size,
      status: skipAnalysis ? 'unanalyzed' : 'pending' // if skipAnalysis, mark as unanalyzed
    });

    if (!skipAnalysis) {
      // Enqueue document for RAG processing
      const { enqueueDocumentProcessing } = require('../queues/documentQueue');
      await enqueueDocumentProcessing(document._id);
    }

    // Invalidate document cache
    await invalidateCache(req.user._id);

    // Audit Log
    await logAudit(req.user._id, 'document_upload', 'Document', req, { documentId: document._id });

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all user documents
// @route   GET /api/documents
// @access  Private
const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ user: req.user._id }).sort('-createdAt');
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get document analysis
// @route   GET /api/documents/:id/analysis
// @access  Private
const getDocumentAnalysis = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.status !== 'completed') {
      return res.status(400).json({ message: 'Document analysis is not yet complete' });
    }

    // Structure the response to match the frontend AnalysisResult type
    const analysisResult = {
      documentId: document._id,
      overallRiskScore: document.overallRiskScore,
      riskLevel: document.riskLevel,
      summary: document.summary,
      analyzedAt: document.updatedAt,
      totalChunks: document.totalChunks,
      clauses: document.clauses.map(c => ({
        id: c.clauseId,
        text: c.text,
        type: c.type,
        riskLevel: c.riskLevel,
        startIndex: c.startIndex,
        endIndex: c.endIndex,
        explanation: c.explanation,
        confidence: c.confidence,
        riskConfidence: c.riskConfidence
      })),
      risks: document.clauses.map(c => ({
        id: c.clauseId,
        category: c.type,
        description: c.text,
        severity: c.riskLevel,
        recommendation: c.explanation
      }))
    };

    res.json(analysisResult);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Compare two documents
// @route   GET /api/documents/compare/:idA/:idB
// @access  Private
const compareDocuments = async (req, res) => {
  try {
    const { idA, idB } = req.params;

    if (idA === idB) {
      return res.status(400).json({ message: 'Cannot compare a document with itself' });
    }

    const docA = await Document.findOne({ _id: idA, user: req.user._id });
    const docB = await Document.findOne({ _id: idB, user: req.user._id });

    if (!docA || !docB) {
      return res.status(404).json({ message: 'One or both documents not found' });
    }

    if (!['completed', 'unanalyzed'].includes(docA.status) || !['completed', 'unanalyzed'].includes(docB.status)) {
      return res.status(400).json({ message: 'Both documents must be ready before comparison' });
    }

    const { compareDocumentsAI } = require('../services/aiService');
    const Diff = require('diff');

    let comparisonResult = {
      documentA: { id: docA._id, name: docA.name },
      documentB: { id: docB._id, name: docB.name },
      similarity: 0,
      changes: 0,
      clauseComparisons: [],
      summary: '',
      diffA: [],
      diffB: []
    };

    if (docA.clauses.length === 0 || docB.clauses.length === 0) {
      // Fallback: One or both documents skipped AI analysis. Perform Standard Text Diff.
      const fetchText = async (doc) => {
        const cmd = new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: doc.s3Key });
        const res = await s3Client.send(cmd);
        const streamToBuffer = async (stream) => new Promise((resolve, reject) => {
          const chunks = [];
          stream.on('data', (c) => chunks.push(c));
          stream.on('error', reject);
          stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
        const buf = await streamToBuffer(res.Body);
        return doc.type === 'application/pdf' ? (await pdf(buf)).text : buf.toString('utf8');
      };

      const textA = await fetchText(docA);
      const textB = await fetchText(docB);

      const diff = Diff.diffLines(textA, textB);
      
      let similarityScore = 100;
      let changesCount = 0;
      let totalLines = 0;

      diff.forEach(part => {
        const lines = part.count || 1;
        totalLines += lines;
        const type = part.added ? 'added' : part.removed ? 'removed' : 'unchanged';
        
        if (type !== 'unchanged') {
          changesCount++;
        }

        const segment = { text: part.value, type };
        if (part.added) {
          comparisonResult.diffB.push(segment);
        } else if (part.removed) {
          comparisonResult.diffA.push(segment);
        } else {
          comparisonResult.diffA.push(segment);
          comparisonResult.diffB.push(segment);
        }
      });

      comparisonResult.changes = changesCount;
      comparisonResult.similarity = totalLines > 0 ? Math.max(0, 100 - Math.round((changesCount / totalLines) * 100)) : 100;
      
      let diffTextForAi = '';
      diff.forEach(part => {
        if (part.added) diffTextForAi += `+ ${part.value}\n`;
        else if (part.removed) diffTextForAi += `- ${part.value}\n`;
      });
      
      try {
        const { summarizeTextDiffAI } = require('../services/aiService');
        const aiSummaryRes = await summarizeTextDiffAI(diffTextForAi);
        comparisonResult.summary = aiSummaryRes.summary;
      } catch (err) {
        console.error("AI Text diff summary failed", err);
        comparisonResult.summary = "Standard text comparison performed because AI clause analysis was skipped.";
      }
    } else {
      // Normal AI clause comparison

    const formatClausesForAI = (clauses) => clauses.map(c => ({
      id: c.clauseId,
      text: c.text,
      type: c.type,
      risk_level: c.riskLevel,
      confidence: c.confidence,
      risk_confidence: c.riskConfidence,
      explanation: c.explanation,
      start_index: c.startIndex,
      end_index: c.endIndex,
    }));

      const aiResult = await compareDocumentsAI(
        formatClausesForAI(docA.clauses),
        formatClausesForAI(docB.clauses)
      );

      comparisonResult.changes = aiResult.comparisons.length;
      comparisonResult.clauseComparisons = aiResult.comparisons;
      comparisonResult.summary = aiResult.summary;

      // Calculate a pseudo similarity score based on similar vs conflicting
      let similarCount = 0;
      aiResult.comparisons.forEach(c => {
        if (c.relationship === 'similar') similarCount++;
      });
      comparisonResult.similarity = aiResult.comparisons.length > 0
        ? Math.round((similarCount / aiResult.comparisons.length) * 100)
        : 100;
    }

    const savedComparison = await Comparison.create({
      user: req.user._id,
      ...comparisonResult
    });

    res.json({ ...comparisonResult, id: savedComparison._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user comparison history
// @route   GET /api/documents/comparisons
// @access  Private
const getComparisons = async (req, res) => {
  try {
    const comparisons = await Comparison.find({ user: req.user._id })
      .select('-clauseComparisons -diffA -diffB')
      .sort('-createdAt');
    res.json(comparisons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get specific comparison
// @route   GET /api/documents/comparisons/:id
// @access  Private
const getComparisonById = async (req, res) => {
  try {
    const comparison = await Comparison.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!comparison) {
      return res.status(404).json({ message: 'Comparison not found' });
    }

    res.json(comparison);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Explain a specific clause
// @route   POST /api/documents/explain-clause
// @access  Private
const explainClause = async (req, res) => {
  try {
    const { text, type, riskLevel } = req.body;

    if (!text || !type || !riskLevel) {
      return res.status(400).json({ message: 'Text, type, and riskLevel are required' });
    }

    const { explainClauseAI } = require('../services/aiService');
    const aiResult = await explainClauseAI(text, type, riskLevel);

    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const buildReportData = (document) => {
  const clauseMap = {};
  const riskInsights = [];

  document.clauses.forEach(c => {
    if (!clauseMap[c.type]) {
      clauseMap[c.type] = {
        type: c.type,
        count: 0,
        riskBreakdown: { low: 0, medium: 0, high: 0 }
      };
    }
    clauseMap[c.type].count += 1;
    if (c.riskLevel) {
      clauseMap[c.type].riskBreakdown[c.riskLevel] += 1;
    }

    if ((c.riskLevel === 'high' || c.riskLevel === 'medium') && c.explanation) {
      if (!riskInsights.includes(c.explanation)) {
        riskInsights.push(c.explanation);
      }
    }
  });

  return {
    clauseAnalysis: Object.values(clauseMap),
    riskInsights: riskInsights.slice(0, 10)
  };
};

// @desc    Download full document report
// @route   POST /api/documents/:id/report
// @access  Private
const downloadDocumentReport = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.status !== 'completed') {
      return res.status(400).json({ message: 'Document analysis is not yet complete' });
    }

    const { explainDocumentAI } = require('../services/aiService');
    const aiResult = await explainDocumentAI(
      document.clauses.map(c => ({
        id: c.clauseId,
        text: c.text,
        type: c.type,
        risk_level: c.riskLevel,
        confidence: c.confidence,
        risk_confidence: c.riskConfidence,
        explanation: c.explanation,
        start_index: c.startIndex,
        end_index: c.endIndex,
      })),
      document.overallRiskScore,
      document.riskLevel
    );

    document.fullAiReport = aiResult.report;
    await document.save();

    const reportData = buildReportData(document);

    // Audit Log
    await logAudit(req.user._id, 'report_download', 'Document', req, { documentId: document._id });

    res.json({
      report: aiResult.report,
      documentName: document.name,
      clauseAnalysis: reportData.clauseAnalysis,
      riskInsights: reportData.riskInsights
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get full document report
// @route   GET /api/documents/:id/report
// @access  Private
const getDocumentReport = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const reportData = buildReportData(document);

    res.json({
      report: document.fullAiReport,
      documentName: document.name,
      clauseAnalysis: reportData.clauseAnalysis,
      riskInsights: reportData.riskInsights
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get negotiation suggestions
// @route   GET /api/documents/:id/negotiate
// @access  Private
const negotiateDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.status !== 'completed') {
      return res.status(400).json({ message: 'Document analysis is not yet complete' });
    }

    if (document.negotiationSuggestions && Object.keys(document.negotiationSuggestions).length > 0) {
      return res.json(document.negotiationSuggestions);
    }

    const { getNegotiationSuggestionsAI } = require('../services/aiService');
    const aiResult = await getNegotiationSuggestionsAI(
      document.clauses.map(c => ({
        id: c.clauseId,
        text: c.text,
        type: c.type,
        risk_level: c.riskLevel,
        confidence: c.confidence,
        risk_confidence: c.riskConfidence,
        explanation: c.explanation,
        start_index: c.startIndex,
        end_index: c.endIndex,
      }))
    );

    document.negotiationSuggestions = aiResult;
    await document.save();

    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get negotiated document text
// @route   GET /api/documents/:id/negotiated-text
// @access  Private
const getNegotiatedText = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.status !== 'completed') {
      return res.status(400).json({ message: 'Document analysis is not yet complete' });
    }

    // Fetch original document from S3
    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: document.s3Key,
    });
    const s3Response = await s3Client.send(getObjectCommand);

    // Stream to buffer
    const streamToBuffer = async (stream) => {
      return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
      });
    };
    const fileBuffer = await streamToBuffer(s3Response.Body);

    let rawText = '';
    if (document.type === 'application/pdf') {
      const pdfData = await pdf(fileBuffer);
      rawText = pdfData.text;
    } else {
      rawText = fileBuffer.toString('utf8');
    }

    // Apply negotiation replacements
    if (document.negotiationSuggestions && document.negotiationSuggestions.suggestions) {
      document.negotiationSuggestions.suggestions.forEach(suggestion => {
        if (suggestion.original_text && suggestion.suggested_text) {
          // Escape special regex characters
          const escapeRegExp = (string) => {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          };

          let escapedOriginal = escapeRegExp(suggestion.original_text.trim());
          // Allow any amount of whitespace (including newlines) to match
          escapedOriginal = escapedOriginal.replace(/\s+/g, '\\s+');

          try {
            const regex = new RegExp(escapedOriginal, 'g');
            rawText = rawText.replace(regex, `\n${suggestion.suggested_text}\n`);
          } catch (e) {
            // Fallback to strict string replace if regex fails
            rawText = rawText.split(suggestion.original_text).join(suggestion.suggested_text);
          }
        }
      });
    }

    res.json({ text: rawText });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get action items
// @route   GET /api/documents/:id/actions
// @access  Private
const documentActionItems = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.status !== 'completed') {
      return res.status(400).json({ message: 'Document analysis is not yet complete' });
    }

    if (document.actionItems && Object.keys(document.actionItems).length > 0) {
      return res.json(document.actionItems);
    }

    const { getActionItemsAI } = require('../services/aiService');
    const aiResult = await getActionItemsAI(
      document.clauses.map(c => ({
        id: c.clauseId,
        text: c.text,
        type: c.type,
        risk_level: c.riskLevel,
        confidence: c.confidence,
        risk_confidence: c.riskConfidence,
        explanation: c.explanation,
        start_index: c.startIndex,
        end_index: c.endIndex,
      }))
    );

    document.actionItems = aiResult;
    await document.save();

    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all cached action items across documents
// @route   GET /api/documents/all/actions
// @access  Private
const getAllActionItems = async (req, res) => {
  try {
    const documents = await Document.find({
      user: req.user._id,
      actionItems: { $exists: true, $ne: null }
    }).select('name actionItems').sort({ createdAt: -1 });

    const allItems = [];
    documents.forEach(doc => {
      if (doc.actionItems && doc.actionItems.items) {
        doc.actionItems.items.forEach(item => {
          allItems.push({
            ...item,
            documentId: doc._id,
            documentName: doc.name
          });
        });
      }
    });

    res.json({ items: allItems });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a document
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = async (req, res) => {
  try {
    console.log(`[DeleteDocument] Hit route with id: ${req.params.id}, user: ${req.user._id}`);
    const document = await Document.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Invalidate cache and log audit
    await invalidateCache(req.user._id);
    await logAudit(req.user._id, 'document_delete', 'Document', req, { documentId: req.params.id });

    res.json({ message: 'Document removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Trigger AI Analysis for an unanalyzed document
// @route   POST /api/documents/:id/analyze
// @access  Private
const triggerAnalysis = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.status !== 'unanalyzed') {
      return res.status(400).json({ message: 'Only unanalyzed documents can be manually triggered for analysis' });
    }

    // Update status to pending
    document.status = 'pending';
    await document.save();

    // Enqueue document for RAG processing
    const { enqueueDocumentProcessing } = require('../queues/documentQueue');
    await enqueueDocumentProcessing(document._id);

    // Invalidate document cache
    await invalidateCache(req.user._id);

    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete comparison
// @route   DELETE /api/documents/comparisons/:id
// @access  Private
const deleteComparison = async (req, res) => {
  try {
    const comparison = await Comparison.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!comparison) {
      return res.status(404).json({ message: 'Comparison not found' });
    }
    
    // Invalidate cache and log audit
    await invalidateCache(req.user._id);
    await logAudit(req.user._id, 'comparison_delete', 'Comparison', req, { comparisonId: req.params.id });
    
    res.json({ message: 'Comparison removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUploadUrl,
  registerDocument,
  getDocuments,
  getDocumentAnalysis,
  compareDocuments,
  explainClause,
  downloadDocumentReport,
  getDocumentReport,
  negotiateDocument,
  documentActionItems,
  getAllActionItems,
  deleteDocument,
  getComparisons,
  getComparisonById,
  deleteComparison,
  getNegotiatedText,
  triggerAnalysis
};
