const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;
const FEEDBACK_FILE = path.join(__dirname, 'feedback-data.json');

const GMAIL_USER = 'torqueandtriumph.26@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || 'kzlixbyildqjizwe';

if (!GMAIL_APP_PASSWORD) {
  console.warn('⚠️  WARNING: GMAIL_APP_PASSWORD is not set. Emails will not be sent.');
  console.warn('   Set it by running: set GMAIL_APP_PASSWORD=your_app_password (Windows)');
  console.warn('   Or: export GMAIL_APP_PASSWORD=your_app_password (Mac/Linux)');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD
  }
});

transporter.verify((err) => {
  if (err) console.error('❌ Email transporter error:', err.message);
  else console.log('✅ Email transporter ready');
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

if (!fs.existsSync(FEEDBACK_FILE)) {
  fs.writeFileSync(FEEDBACK_FILE, JSON.stringify([]));
}

// Submit feedback
app.post('/api/feedback', async (req, res) => {
  const { name, email, subject, message } = req.body;

  console.log('📩 Feedback received:', { name, email, subject });

  if (!name || !email || !subject || !message) {
    console.error('❌ Missing fields:', { name, email, subject, message });
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Save to file
  try {
    const feedbacks = JSON.parse(fs.readFileSync(FEEDBACK_FILE));
    feedbacks.push({ name, email, subject, message, time: new Date().toLocaleString() });
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(feedbacks, null, 2));
    console.log('✅ Feedback saved to file');
  } catch (err) {
    console.error('❌ Failed to save feedback:', err.message);
  }

  // Send email
  if (!GMAIL_APP_PASSWORD) {
    console.warn('⚠️  Skipping email — GMAIL_APP_PASSWORD not set');
    return res.json({ success: true, warning: 'Feedback saved but email not sent (no app password).' });
  }

  try {
    await transporter.sendMail({
      from: `"T&T Feedback" <${GMAIL_USER}>`,
      to: GMAIL_USER,
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
    console.log('✅ Email sent successfully to', GMAIL_USER);
  } catch (err) {
    console.error('❌ Email sending failed:', err.message);
    return res.status(500).json({ error: 'Feedback saved but email failed to send.' });
  }

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`✅ Torque & Triumph server running at http://localhost:${PORT}`);
});
