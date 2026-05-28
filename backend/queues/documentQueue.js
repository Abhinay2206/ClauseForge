const { Queue } = require('bullmq');

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
};

const documentQueue = new Queue('DocumentProcessing', { connection });
const documentDLQ = new Queue('DocumentDLQ', { connection });

const enqueueDocumentProcessing = async (documentId) => {
  try {
    const job = await documentQueue.add('process-document', { documentId }, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });
    console.log(`Enqueued job ${job.id} for document ${documentId}`);
    return job;
  } catch (error) {
    console.error(`Failed to enqueue job for document ${documentId}:`, error);
    throw error;
  }
};

module.exports = {
  documentQueue,
  documentDLQ,
  enqueueDocumentProcessing
};
