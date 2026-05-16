import nodemailer from 'nodemailer';
import { config } from '../config/env';

export const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,

  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS,
  },

  connectionTimeout: 10000,
});

transporter.verify((error, success) => {
  if (error) {
    console.log('MAIL ERROR:', error);
  } else {
    console.log('MAIL SERVER READY:', success);
  }
});