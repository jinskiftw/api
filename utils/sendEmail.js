require('dotenv').config();
const nodemailer = require('nodemailer');
const fs = require('fs');

const sendEmail = async (email,data) => {

  var transporter = nodemailer.createTransport({
    service: process.env.SERVICE,
    auth: {
      user: process.env.GMAIL,
      pass: process.env.MAIL_PASSWORD
    }
  });
  const logoPath = `uploads/public/wheelman.png`;
  const logoData = await fs.promises.readFile(logoPath, { encoding: 'base64' });

  const activateLink=`${process.env.FRONTEND_URL}/confirm/${data.token}`;
  const homeLink=`${process.env.FRONTEND_SITE}`;
  const aboutusLink=`${process.env.FRONTEND_SITE}/about`;
  const productFeatureLink=`${process.env.FRONTEND_SITE}/product-features`;
  const contactLink=`${process.env.FRONTEND_SITE}/contact`;
  const privacyPolicyLink=`${process.env.FRONTEND_SITE}/privacypolicy`;
  const termConditionLink=`${process.env.FRONTEND_SITE}/termsandconditions`;
  var mailOptions = {
    from: process.env.GMAIL,
    to: email,
    subject: 'Wheelman:Registration Successful',
  
    html:`<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Arial', sans-serif; background: #F0F0F0; padding: 30px">
    
      <!-- Logo -->
      <img src="cid:logo" alt="WheelMan Logo" style="max-width: 100%; height: auto;">
    
      <h1 style="font-weight: 500;">Welcome to WheelMan!</h1>
    
      <p>Congratulations! Your 30-day free trial starts today. Please save this email so you can refer to it later. We are excited for you to be a part of our community!</p>

      <p style="font-weight:bold;">YOUR WHEELMAN LOGIN ADDRESS:</p>
      <p style="font-weight:bold;"><a href="mailto:${email}">${email}</a></p>

      <p>Please click the Confirm button below to complete the registration process.</p>

      <p>Failure to confirm your email account within 48 hours will result in account deletion. You will have to redo the membership sign-up process and receive a new verification email.</p>
   
      <p><a href="${activateLink}" style="text-decoration: none; color: #165840;background-color: rgba(22, 88, 64, 0.15); display: inline-block; padding: 10px 30px; text-transform: uppercase; font-weight: bold; letter-spacing: 2px; margin: 10px 0;">Confirm</a></p>

      <p style="font-size: 18px;">We're here to help</p>
    
      <p>If you have any questions or concerns, please send us an email at
        support@wheelmanllc.com</p>
        
      <p style="font-size: 22px;">Whatever you care about, let WheelMan maintain it.</p>

      <div style="text-align: center; padding: 5px; font-size: 14px;" >
        <a href="${homeLink}">Home</a> | <a href="${aboutusLink}">About</a> | <a href="${productFeatureLink}">Product Features</a> | <a href="${contactLink}">Contact</a> 
      </div>
      <div style="text-align: center;  padding: 5px;  font-size: 14px;">
        <a href="${privacyPolicyLink}">Privacy Policy</a> | <a href="${termConditionLink}">Terms & Conditions</a>
      </div>
    
    </body>
    </html>`,
    attachments: [{
      filename: 'wheelman.png',
      path: `uploads/public/wheelman.png`,
      cid: 'logo' //same cid value as in the html img src
  }]
  };
  console.log(mailOptions.html); 
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });

}


const sendHtmlEmail = async (toEmail,subject,html) => {

  var transporter = nodemailer.createTransport({
    service: process.env.SERVICE,
    port: 465, // SMTP port for SSL
    secure: true,
    auth: {
      user: process.env.GMAIL,
      pass: process.env.MAIL_PASSWORD
    }
  });
 
  var mailOptions = {
    from: process.env.GMAIL,
    to: toEmail,
    subject ,
  
    html,
 
  };
 
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });

}

module.exports = {sendEmail,sendHtmlEmail} 
