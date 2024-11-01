// require("dotenv").config();
// const nodemailer = require("nodemailer");
// const { SMTP_MAIL, SMTP_PASSWORD } = process.env;
// const sendMail = async (email, mailSubjet, content) => {
//   try {
//     const transport = nodemailer.createTransport({
//       service:'gmail',
//       host: "smtp.gmail.com",
//       // port: 587,
//       port:465,
//       // secure: false,
//       secure:true,
//       auth: {
//         // user: "vinod.mediasearchgroup@gmail.com",
//         // pass: "ieee leja pfsc ptix",
//         user: SMTP_MAIL,       // Access SMTP_MAIL from .env
//         pass: SMTP_PASSWORD,
        
//       },
//     });
//     const mailOption = {
//       from: SMTP_MAIL,
//       to: email,
//       subject: mailSubjet,
//       html: content,
//     };
//     transport.sendMail(mailOption, function (error, info) {
//       if (error) {
//         console.log(error);
//       } else {
//         console.log("Mail send succesfull", info.response);
//       }
//     });
//   } catch (error) {
//     console.log(error.message);
//   }
// };
// module.exports = sendMail;

require("dotenv").config();
const nodemailer = require("nodemailer");

const sendMail = async (email, mailSubject, content) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_MAIL,  // Gmail address from .env
        pass: process.env.SMTP_PASSWORD,  // App password from .env
      },
    });

    const mailOptions = {
      from: `"Support Team" <${process.env.SMTP_MAIL}>`,  // Display name and address
      to: email,  // Recipient email
      subject: mailSubject,
      html: content,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Mail sent successfully:", info.response);
    return info;
    
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw new Error("Failed to send email, please try again later.");
  }
};

module.exports = sendMail;
