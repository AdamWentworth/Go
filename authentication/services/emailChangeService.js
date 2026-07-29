const { buildPasswordResetEmail } = require('./passwordResetEmailService');

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
})[char]);

const buildEmailChangeEmail = ({ username, verifyUrl, newEmail }) => {
  const base = buildPasswordResetEmail({ username, resetUrl: verifyUrl });
  const safeEmail = escapeHtml(newEmail);
  return {
    subject: 'Confirm your new PokeGoNexus email',
    text: `Hi ${username},

Confirm ${newEmail} as the new email for your PokeGoNexus account:

${verifyUrl}

This secure link expires in 30 minutes and can only be used once. If you did not request this change, ignore this email and your account email will remain unchanged.`,
    html: base.html
      .replaceAll(
        'Your secure PokeGoNexus password reset link expires in 30 minutes.',
        'Confirm your new PokeGoNexus email within 30 minutes.',
      )
      .replaceAll('Reset your password', 'Confirm your new email')
      .replaceAll('reset the password for', 'change the email address for')
      .replaceAll('choose a new password', `confirm ${safeEmail} as your new sign-in email`)
      .replaceAll('Reset my password', 'Confirm new email')
      .replaceAll('password reset link', 'email verification link')
      .replaceAll('Your password has not changed.', 'Your account email has not changed.'),
  };
};

const sendEmailChangeVerification = async ({ email, username, verifyUrl }) => {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');
  const content = buildEmailChangeEmail({
    username,
    verifyUrl,
    newEmail: email,
  });
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.PASSWORD_RESET_FROM ||
        'PokeGoNexus Accounts <accounts@mail.pokegonexus.com>',
      reply_to: process.env.PASSWORD_RESET_REPLY_TO || 'accounts@pokegonexus.com',
      to: [email],
      ...content,
    }),
  });
  if (!response.ok) throw new Error(`Resend rejected email verification (${response.status})`);
};

module.exports = { buildEmailChangeEmail, sendEmailChangeVerification };
