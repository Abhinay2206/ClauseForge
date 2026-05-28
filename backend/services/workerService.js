const { Worker } = require('bullmq');
const DocumentModel = require('../models/Document');
const { processDocumentForRAG } = require('./ragService');
const { analyzeDocument } = require('./aiService');
const { invalidateCache } = require('../middleware/cache');
const { VirusDetectedError } = require('./virusScanner');

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
};

const initializeWorker = () => {
  const worker = new Worker('DocumentProcessing', async job => {
    const { documentId } = job.data;
    console.log(`Worker picked up job ${job.id} for document ${documentId}`);

    try {
      const document = await DocumentModel.findById(documentId);
      if (!document) throw new Error('Document not found');

      // 1. Update status to analyzing
      document.status = 'analyzing';
      await document.save();
      await invalidateCache(document.user);

      // 2. Process document through RAG pipeline (chunk + embed into ChromaDB)
      await processDocumentForRAG(documentId);

      // 3. Run AI clause detection + risk analysis via FastAPI
      console.log(`Starting AI analysis for document ${documentId}...`);
      const aiResults = await analyzeDocument(documentId);

      // 4. Store AI results in MongoDB and update status to completed
      await DocumentModel.findByIdAndUpdate(documentId, {
        status: 'completed',
        overallRiskScore: aiResults.overall_risk_score,
        riskLevel: aiResults.risk_level,
        summary: aiResults.summary,
        totalChunks: aiResults.total_chunks,
        clauses: aiResults.clauses.map(c => ({
          clauseId: c.id,
          text: c.text,
          type: c.type,
          riskLevel: c.risk_level,
          confidence: c.confidence,
          riskConfidence: c.risk_confidence,
          explanation: c.explanation,
          startIndex: c.start_index,
          endIndex: c.end_index,
        })),
      });
      
      await invalidateCache(document.user);
      console.log(`Job ${job.id} for document ${documentId} completed successfully.`);
    } catch (error) {
      console.error(`Job ${job.id} for document ${documentId} failed:`, error);
      
      // Update status to failed or failed_virus
      const statusToSet = error instanceof VirusDetectedError ? 'failed_virus' : 'failed';
      const failedDoc = await DocumentModel.findByIdAndUpdate(documentId, { status: statusToSet });
      if (failedDoc) await invalidateCache(failedDoc.user);
      throw error;
    }
  }, { connection });

  worker.on('completed', job => {
    console.log(`${job.id} has completed!`);
  });

  worker.on('failed', (job, err) => {
    console.log(`${job.id} has failed with ${err.message}`);
  });

  console.log('BullMQ DocumentProcessing worker initialized.');
  return worker;
};

module.exports = {
  initializeWorker
};
