const { Queue } = require('bullmq');

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
};

const emailQueue = new Queue('EmailQueue', { connection });

/**
 * Enqueue an email to be sent asynchronously.
 * 
 * @param {string} templateType - 'report', 'alert', 'welcome', 'newsletter'
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {object} context - Data to inject into the template
 * @param {object} options - BullMQ job options
 */
const enqueueEmail = async (templateType, to, subject, context = {}, options = {}) => {
  return await emailQueue.add(
    templateType,
    { templateType, to, subject, context },
    {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      ...options,
    }
  );
};

module.exports = {
  emailQueue,
  enqueueEmail,
};
