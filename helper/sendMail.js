require("dotenv").config();
const nodemailer = require("nodemailer");
const { SMTP_MAIL, SMTP_PASSWORD } = process.env;
const sendMail = async (email, mailSubjet, content) => {
  try {
    const transport = nodemailer.createTransport({
      host: "smtp.gmail.com",
      // port: 587,
      // secure: false,
      port: 465,
      secure: true,
      auth: {
        // user: "vinod.mediasearchgroup@gmail.com",
        // pass: "ieee leja pfsc ptix",
        user: process.env.SMTP_MAIL,  // Gmail address from .env
        pass: process.env.SMTP_PASSWORD, 
      },
    });
    const mailOption = {
      from: SMTP_MAIL,
      to: email,
      subject: mailSubjet,
      html: content,
    };
    transport.sendMail(mailOption, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Mail send succesfull", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};
module.exports = sendMail;
