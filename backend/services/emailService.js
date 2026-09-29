const nodemailer = require("nodemailer");


// Create email transporter
const transporter = nodemailer.createTransport({
    service: "gmail",

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});


// Send result email
const sendResultEmail = async (
    studentEmail,
    studentName,
    pdfBuffer
) => {

    const mailOptions = {
        from: process.env.EMAIL_USER,

        to: studentEmail,

        subject: "Student Result Report",

        text: `Dear ${studentName},

Your result report has been generated successfully.

Please find your result PDF attached with this email.

Regards,
Student Management System`,

        attachments: [
            {
                filename: "Student-Result.pdf",
                content: pdfBuffer,
                contentType: "application/pdf"
            }
        ]
    };

    const result = await transporter.sendMail(
        mailOptions
    );

    return result;
};


module.exports = {
    sendResultEmail
};