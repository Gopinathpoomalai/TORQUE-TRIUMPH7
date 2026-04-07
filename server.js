const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;
const FEEDBACK_FILE = path.join(__dirname, 'feedback-data.json');

// Gmail config - use App Password (not your real password)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'torqueandtriumph.26@gmail.com',
    pass: 'YOUR_APP_PASSWORD_HERE'  // Replace with Gmail App Password
  }
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
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Save to file
  const feedbacks = JSON.parse(fs.readFileSync(FEEDBACK_FILE));
  feedbacks.push({ name, email, subject, message, time: new Date().toLocaleString() });
  fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(feedbacks, null, 2));

  // Send email
  try {
    await transporter.sendMail({
      from: `"T&T Feedback" <torqueandtriumph.26@gmail.com>`,
      to: 'torqueandtriumph.26@gmail.com',
      subject: `New Feedback: ${subject}`,
      html: `
        <h2 style="color:#e63946;">New Feedback - Torque & Triumph</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong><br/>${message}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      `
    });
  } catch (err) {
    console.log('Email error:', err.message);
  }

  res.json({ success: true });
});


app.listen(PORT, () => {
  console.log(`✅ Torque & Triumph server running at http://localhost:${PORT}`);
});
