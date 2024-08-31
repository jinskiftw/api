const nodemailer = require('nodemailer');

const sendResetPasswordEmail = async (options) => {
    const transpoter = nodemailer.createTransport({
        service: process.env.SERVICE,
        auth: {
            user: process.env.GMAIL,
            pass: process.env.MAIL_PASSWORD,
        },
    });
    const mailOptions = {
        from: process.env.GMAIL,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };
    await transpoter.sendMail(mailOptions);
};

module.exports = sendResetPasswordEmail
