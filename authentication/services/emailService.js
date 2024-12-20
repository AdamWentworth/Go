// services/emailService.js

const nodemailer = require('nodemailer');
const logger = require('../middlewares/logger'); // Ensure logger is correctly imported
require('dotenv').config();

/**
 * Creates a transporter object using SMTP transport.
 * Adjust the service and authentication as per your email provider.
 */
const transporter = nodemailer.createTransport({
    service: 'Gmail', // e.g., Gmail, SendGrid, etc.
    auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your email password or app-specific password
    },
});

/**
 * Sends a password reset email to the user.
 * @param {string} to - Recipient's email address.
 * @param {string} token - Password reset token.
 */
const sendResetPasswordEmail = async (to, token) => {
    // Construct the password reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: 'Password Reset Request',
        text: `You are receiving this email because you (or someone else) have requested a password reset for your account.\n\n
Please click on the following link, or paste it into your browser, to complete the process within the next 1 hour:\n\n
${resetUrl}\n\n
If you did not request this, please ignore this email and your password will remain unchanged.\n`,
        html: `
            <p>You are receiving this email because you (or someone else) have requested a password reset for your account.</p>
            <p>Please click on the following link, or paste it into your browser, to complete the process within the next 1 hour:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        logger.info(`Reset password email sent to ${to}`);
    } catch (error) {
        logger.error(`Failed to send reset password email to ${to}: ${error.message}`);
        throw new Error('Failed to send reset password email');
    }
};

module.exports = {
    sendResetPasswordEmail,
};
