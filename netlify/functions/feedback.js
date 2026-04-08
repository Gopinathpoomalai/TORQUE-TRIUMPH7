const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON.' }) };
  }

  const { name, email, subject, message } = body;

  if (!name || !email || !subject || !message) {
    return { statusCode: 400, body: JSON.stringify({ error: 'All fields are required.' }) };
  }

  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!pass) {
    console.error('GMAIL_APP_PASSWORD is not set');
    return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfiguration.' }) };
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'torqueandtriumph.26@gmail.com',
      pass: pass
    }
  });

  try {
    await transporter.sendMail({
      from: '"T&T Feedback" <torqueandtriumph.26@gmail.com>',
      to: 'torqueandtriumph.26@gmail.com',
      replyTo: email,
      subject: `New Feedback: ${subject}`,
      html: `
        <h2 style="color:#e63946;">New Feedback - Torque &amp; Triumph</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong><br/>${message}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      `
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('Email sending failed:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to send email: ' + err.message }) };
  }
};
