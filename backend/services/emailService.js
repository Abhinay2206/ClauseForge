const fs = require('fs').promises;
const path = require('path');
const mjml2html = require('mjml');
const nodemailer = require('nodemailer');
const EmailLog = require('../models/EmailLog');

let transporterPromise;

const createTransporter = async () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const transportOptions = {
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    };

    if (process.env.EMAIL_SERVICE) {
      transportOptions.service = process.env.EMAIL_SERVICE;
    } else {
      transportOptions.host = process.env.SMTP_HOST;
      transportOptions.port = Number(process.env.SMTP_PORT || 587);
      transportOptions.secure = Number(process.env.SMTP_PORT) === 465;
    }

    const transporter = nodemailer.createTransport(transportOptions);
    console.log(`[EmailService] Email transporter configured for: ${process.env.EMAIL_USER}`);
    return transporter;
  }

  try {
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.log(`[EmailService] Using Ethereal fallback. Credentials: ${testAccount.user} / ${testAccount.pass}`);
    return transporter;
  } catch (error) {
    console.warn(`[EmailService] Ethereal setup failed; using JSON transport: ${error.message}`);
    return nodemailer.createTransport({ jsonTransport: true });
  }
};

const getTransporter = () => {
  if (!transporterPromise) {
    transporterPromise = createTransporter();
  }

  return transporterPromise;
};

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

  const baseContent = await fs.readFile(basePath, 'utf-8');
  let partialContent = '';

  try {
    partialContent = await fs.readFile(partialPath, 'utf-8');
  } catch (error) {
    throw new Error(`Template ${templateType} not found`);
  }

  const fullContext = {
    year: new Date().getFullYear(),
    preferencesUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile`,
    ...context,
  };

  const combinedTemplate = baseContent.replace('{{{content}}}', partialContent);
  const finalMjml = interpolate(combinedTemplate, fullContext);
  const { html, errors } = await mjml2html(finalMjml, { validationLevel: 'soft' });

  if (errors && errors.length) {
    console.warn('[EmailService] MJML compiled with warnings:', errors);
  }

  return html;
};

const sendTemplatedEmail = async ({ templateType, to, subject, context = {} }) => {
  let emailLog;

  try {
    emailLog = await EmailLog.create({
      recipient: to,
      subject,
      templateType,
      status: 'queued',
      documentId: context.documentId || null,
      userId: context.userId || null,
    });

    const [transporter, html] = await Promise.all([
      getTransporter(),
      compileMjmlTemplate(templateType, context),
    ]);

    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'ClauseForge <no-reply@clauseforge.local>';
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    if (transporter.options.host === 'smtp.ethereal.email' && info.messageId) {
      console.log(`[EmailService] Ethereal Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    emailLog.status = 'sent';
    emailLog.provider = 'nodemailer';
    emailLog.providerMessageId = info.messageId;
    await emailLog.save();

    return {
      success: true,
      messageId: info.messageId,
      provider: 'nodemailer',
      previewUrl: nodemailer.getTestMessageUrl(info),
    };
  } catch (error) {
    if (emailLog) {
      emailLog.status = 'failed';
      emailLog.errorMessage = error.message;
      await emailLog.save();
    }

    throw error;
  }
};

module.exports = {
  compileMjmlTemplate,
  getTransporter,
  sendTemplatedEmail,
};
