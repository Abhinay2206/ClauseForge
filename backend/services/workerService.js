const { Worker, UnrecoverableError } = require('bullmq');
const DocumentModel = require('../models/Document');
const { processDocumentForRAG } = require('./ragService');
const { analyzeDocument } = require('./aiService');
const { invalidateCache } = require('../middleware/cache');
const { VirusDetectedError } = require('./virusScanner');
const { enqueueEmail } = require('../queues/emailQueue');

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
};

const initializeWorker = () => {
  const worker = new Worker('DocumentProcessing', async job => {
    const { documentId } = job.data;
    console.log(`Worker picked up job ${job.id} for document ${documentId}`);

    try {
      const document = await DocumentModel.findById(documentId).populate('user');
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
      
      await invalidateCache(document.user._id || document.user);
      
      // 5. Send Email Report
      if (document.user && document.user.emailPreferences?.reports !== false) {
        await enqueueEmail('report', document.user.email, 'Your ClauseForge Analysis is Ready', {
          documentName: document.originalName,
          summary: aiResults.summary || 'Your document analysis has been successfully generated.',
          riskScore: aiResults.overall_risk_score,
          clauseCount: aiResults.clauses.length,
          criticalCount: aiResults.clauses.filter(c => c.risk_level === 'High' || c.risk_level === 'Critical').length,
          riskColor: aiResults.overall_risk_score > 70 ? '#EF4444' : aiResults.overall_risk_score > 30 ? '#F59E0B' : '#10B981',
          reportUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/reports/${documentId}`,
          documentId,
          userId: document.user._id
        });
      }

      console.log(`Job ${job.id} for document ${documentId} completed successfully.`);
    } catch (error) {
      console.error(`Job ${job.id} for document ${documentId} failed:`, error);
      
      if (error instanceof VirusDetectedError) {
        const failedDoc = await DocumentModel.findByIdAndUpdate(documentId, { status: 'failed_virus' });
        if (failedDoc) await invalidateCache(failedDoc.user);
        throw new UnrecoverableError(error.message);
      }
      
      throw error;
    }
  }, { 
    connection,
    lockDuration: 300000, // 5 minutes to prevent lock expiration during long AI analysis
  });

  worker.on('completed', job => {
    console.log(`${job.id} has completed!`);
  });

  worker.on('failed', async (job, err) => {
    console.log(`${job.id} has failed with ${err.message}. Attempt ${job.attemptsMade} of ${job.opts.attempts}`);
    if (job.attemptsMade >= job.opts.attempts || err.name === 'UnrecoverableError') {
      console.log(`Job ${job.id} has exhausted retries or is unrecoverable. Moving to DLQ.`);
      try {
        const { documentDLQ } = require('../queues/documentQueue');
        await documentDLQ.add('dlq-job', {
          originalJobId: job.id,
          documentId: job.data?.documentId,
          error: err.message,
          failedAt: new Date(),
          originalData: job.data
        });
        
        if (err.name !== 'UnrecoverableError' && job.data?.documentId) {
          const failedDoc = await DocumentModel.findByIdAndUpdate(job.data.documentId, { status: 'failed_dlq' });
          if (failedDoc) await invalidateCache(failedDoc.user);
        }
      } catch (dlqErr) {
        console.error(`Failed to move job ${job.id} to DLQ:`, dlqErr);
      }
    }
  });

  console.log('BullMQ DocumentProcessing worker initialized.');
  return worker;
};

module.exports = {
  initializeWorker
};
