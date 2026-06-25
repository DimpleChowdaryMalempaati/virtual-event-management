const nodemailer = require('nodemailer');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');

let transporter = null;

function isEmailConfigured() {
  const { host, user, pass } = config.smtp;
  return Boolean(host && user && pass);
}

function getTransporter() {
  if (!isEmailConfigured()) {
    return null;
  }

  if (transporter) {
    return transporter;
  }

  const { host, user, pass, port } = config.smtp;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

async function sendRegistrationEmail({ to, userName, event }) {
  const subject = `Registration confirmed: ${event.title}`;
  const text = [
    `Hi ${userName},`,
    '',
    `You have successfully registered for "${event.title}".`,
    '',
    `Date: ${event.date}`,
    `Time: ${event.time}`,
    `Description: ${event.description}`,
    '',
    'We look forward to seeing you at the event!',
  ].join('\n');

  const mailTransporter = getTransporter();

  if (!mailTransporter) {
    console.log('[Email - SMTP not configured, logged to console]');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text);
    return;
  }

  try {
    await mailTransporter.sendMail({
      from: config.smtp.user,
      to,
      subject,
      text,
      html: `
        <h2>Registration Confirmed</h2>
        <p>Hi ${userName},</p>
        <p>You have successfully registered for <strong>${event.title}</strong>.</p>
        <ul>
          <li><strong>Date:</strong> ${event.date}</li>
          <li><strong>Time:</strong> ${event.time}</li>
          <li><strong>Description:</strong> ${event.description}</li>
        </ul>
        <p>We look forward to seeing you at the event!</p>
      `,
    });
  } catch (error) {
    console.error('Failed to send registration email:', error.message);
    throw ApiError.serviceUnavailable(
      'Registration could not be completed because the confirmation email failed to send. Please try again later.'
    );
  }
}

module.exports = { sendRegistrationEmail };
