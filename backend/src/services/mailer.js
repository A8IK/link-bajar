const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../utils/logger');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!config.mail.host || !config.mail.user) {
    transporter = {
      sendMail: async (opts) => {
        logger.info(`[mail-stub] to=${opts.to} subject="${opts.subject}"`);
        return { messageId: 'stub' };
      },
    };
    return transporter;
  }
  transporter = nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.port === 465,
    auth: { user: config.mail.user, pass: config.mail.pass },
  });
  return transporter;
};

const send = async ({ to, subject, html, text }) => {
  const t = getTransporter();
  return t.sendMail({ from: config.mail.from, to, subject, html, text });
};

const wrap = (title, body) => `
<!doctype html><html><body style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0">
    <div style="font-size:18px;font-weight:800;color:#2563eb">Link Bajar</div>
    <h1 style="font-size:22px;color:#0f172a;margin-top:16px">${title}</h1>
    <div style="color:#475569;line-height:1.6">${body}</div>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
    <div style="font-size:12px;color:#94a3b8">© ${new Date().getFullYear()} Link Bajar</div>
  </div>
</body></html>`;

module.exports = {
  send,
  templates: {
    projectInvite: ({ projectName, inviteUrl, senderName }) => ({
      subject: `${senderName || 'A teammate'} invited you to "${projectName}"`,
      html: wrap(
        'Project invite',
        `<p>You have been invited to collaborate on <strong>${projectName}</strong> on Link Bajar.</p>
         <p><a href="${inviteUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Accept invite</a></p>`,
      ),
    }),
    withdrawalApproved: ({ name, amount, method, bankLast5 }) => ({
      subject: 'Your withdrawal has been approved',
      html: wrap(
        'Withdrawal approved',
        `<p>Hi ${name},</p>
         <p>Your withdrawal of <strong>$${amount}</strong> via <strong>${method}</strong> has been approved
         ${bankLast5 ? `(account ending <strong>${bankLast5}</strong>)` : ''}.</p>
         <p>Funds typically arrive within 1–3 business days.</p>`,
      ),
    }),
    refundProcessed: ({ name, amount, reason }) => ({
      subject: 'Your refund has been processed',
      html: wrap(
        'Refund processed',
        `<p>Hi ${name},</p>
         <p>We have processed a refund of <strong>$${amount}</strong>.</p>
         ${reason ? `<p>Reason: ${reason}</p>` : ''}`,
      ),
    }),
    couponBlast: ({ name, code, message }) => ({
      subject: `Here is your code: ${code}`,
      html: wrap(
        `Hi ${name || 'there'} 👋`,
        `<p>${message || 'A new coupon is waiting for you.'}</p>
         <p>Use code <code style="background:#eff6ff;color:#2563eb;padding:4px 10px;border-radius:6px;font-weight:700">${code}</code> at checkout.</p>`,
      ),
    }),
    orderDelivered: ({ orderNumber, liveLink }) => ({
      subject: `Order ${orderNumber} delivered`,
      html: wrap(
        'Your order is live 🎉',
        `<p>Order <strong>${orderNumber}</strong> has been delivered.</p>
         <p>Live link: <a href="${liveLink}">${liveLink}</a></p>`,
      ),
    }),
  },
};
