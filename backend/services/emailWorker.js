const { Worker } = require('bullmq');
const { sendTemplatedEmail } = require('./emailService');

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
};

const emailWorker = new Worker('EmailQueue', async (job) => {
  const { templateType, to, subject, context } = job.data;
  return sendTemplatedEmail({ templateType, to, subject, context });
}, { connection });

emailWorker.on('completed', (job) => {
  console.log(`[EmailWorker] Job ${job.id} completed successfully`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`[EmailWorker] Job ${job?.id} failed with error ${err.message}`);
});

emailWorker.on('error', (err) => {
  console.error(`[EmailWorker] Worker error: ${err.message}`);
});

module.exports = emailWorker;
