const { Queue } = require('bullmq');
const { sendTemplatedEmail } = require('../services/emailService');

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  connectTimeout: 1000,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
};

const emailQueue = new Queue('EmailQueue', { connection });

emailQueue.on('error', (error) => {
  console.warn(`[EmailQueue] Queue error: ${error.message}`);
});

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
  const payload = { templateType, to, subject, context };

  try {
    return await emailQueue.add(
      templateType,
      payload,
      {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        ...options,
      }
    );
  } catch (error) {
    console.warn(`[EmailQueue] Queue unavailable, sending notification directly: ${error.message}`);
    return sendTemplatedEmail(payload);
  }
};

module.exports = {
  emailQueue,
  enqueueEmail,
};
