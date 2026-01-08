const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    console.log(`[Email Service] Attempting to send email to: ${options.email}`);
    console.log(`[Email Service] Using account: ${process.env.EMAIL_USER ? '***@gmail.com' : 'MISSING'}`);

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email Service] Email sent successfully using nodemailer implementation. Message ID: ${info.messageId}`);
    } catch (error) {
        console.error(`[Email Service] ERROR: Failed to send email.`);
        console.error(error);
        throw error; // Re-throw so auth.js catches it
    }
};

module.exports = sendEmail;
