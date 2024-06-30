import config from '../config';
import nodemailer from 'nodemailer';

export const sendEmail = async (to: string, html: string) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com.',
    port: 587,
    secure: config.NODE_ENV === 'production',
    auth: {
      // TODO: replace `user` and `pass` values from <https://forwardemail.net>
      user: 'safarahafkhan@gmail.com',
      pass: 'csgx lkpq qore tiii',
    },
  });

  await transporter.sendMail({
    from: 'safarahafkhan@gmail.com', // sender address
    to, // list of receivers
    subject: 'Reset your password within ten mins!', // Subject line
    text: '',
    html, // html body
  });
};
