const { Worker } = require('bullmq');
const fs = require('fs').promises;
const path = require('path');
const mjml2html = require('mjml');
const nodemailer = require('nodemailer');
const EmailLog = require('../models/EmailLog');

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
};

// Setup Nodemailer transport using provided email credentials
let transporter;
const setupNodemailer = async () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    // Determine the service dynamically or fallback to standard SMTP
    let transportOptions = {
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    };

    if (process.env.EMAIL_SERVICE) {
      transportOptions.service = process.env.EMAIL_SERVICE; // e.g. 'gmail'
    } else {
      transportOptions.host = process.env.SMTP_HOST;
      transportOptions.port = process.env.SMTP_PORT || 587;
      transportOptions.secure = process.env.SMTP_PORT == 465;
    }

    transporter = nodemailer.createTransport(transportOptions);
    console.log(`[EmailWorker] Email transporter configured for: ${process.env.EMAIL_USER}`);
  } else {
    // Generate test account automatically for local dev fallback
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`[EmailWorker] Using Ethereal fallback. Credentials: ${testAccount.user} / ${testAccount.pass}`);
  }
};
setupNodemailer();

const interpolate = (templateStr, context) => {
  return templateStr.replace(/{{([\w.]+)}}/g, (match, key) => {
    let value = context;
    for (const k of key.split('.')) {
      value = value ? value[k] : undefined;
    }
    return value !== undefined ? value : '';
  });
};

const compileMjmlTemplate = async (templateType, context) => {
  const basePath = path.join(__dirname, '../templates', 'base.mjml');
  const partialPath = path.join(__dirname, '../templates', `${templateType}.mjml`);

  let baseContent = await fs.readFile(basePath, 'utf-8');
  let partialContent = '';
  
  try {
    partialContent = await fs.readFile(partialPath, 'utf-8');
  } catch (error) {
    throw new Error(`Template ${templateType} not found`);
  }

  // Inject partial into base {{{content}}}
  let combinedTemplate = baseContent.replace('{{{content}}}', partialContent);

  // Add default context
  const fullContext = {
    year: new Date().getFullYear(),
    preferencesUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile?tab=notifications`,
    ...context
  };

  // Interpolate variables
  const finalMjml = interpolate(combinedTemplate, fullContext);

  // Compile MJML to HTML
  const { html, errors } = mjml2html(finalMjml, { validationLevel: 'soft' });
  if (errors && errors.length) {
    console.warn(`[EmailWorker] MJML compiled with warnings:`, errors);
  }

  return html;
};

const emailWorker = new Worker('EmailQueue', async (job) => {
  const { templateType, to, subject, context } = job.data;
  let emailLog;

  try {
    // 1. Create EmailLog in queued state
    emailLog = await EmailLog.create({
      recipient: to,
      subject,
      templateType,
      status: 'queued',
      documentId: context.documentId || null,
      userId: context.userId || null,
    });

    // 2. Compile Template
    const html = await compileMjmlTemplate(templateType, context);

    // 3. Send Email
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'ClauseForge <no-reply@clauseforge.local>';
    let messageId;
    let providerUsed = 'nodemailer';

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    
    messageId = info.messageId;
    
    // Log Ethereal preview URLs if using the test account
    if (transporter.options.host === 'smtp.ethereal.email' && info.messageId) {
      console.log(`[EmailWorker] Ethereal Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    // 4. Update EmailLog
    emailLog.status = 'sent';
    emailLog.provider = providerUsed;
    emailLog.providerMessageId = messageId;
    await emailLog.save();

    return { success: true, messageId, provider: providerUsed };

  } catch (error) {
    console.error(`[EmailWorker] Job ${job.id} failed:`, error.message);
    if (emailLog) {
      emailLog.status = 'failed';
      emailLog.errorMessage = error.message;
      await emailLog.save();
    }
    throw error;
  }
}, { connection });

emailWorker.on('completed', (job) => {
  console.log(`[EmailWorker] Job ${job.id} completed successfully`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`[EmailWorker] Job ${job.id} failed with error ${err.message}`);
});

module.exports = emailWorker;
