// index.js
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// ======================
// Environment variables
// ======================
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = 'whatsapp:+14155238886'; // Twilio Sandbox number

// ======================
// Hardcoded Q&A dictionary
// ======================
const qa = {
  'working hours': 'Our working hours are from Sunday to Thursday, 9:00 AM to 5:00 PM. How else can I help you?',
  'refund policy': 'Our refund policy allows for returns within 14 days of purchase, provided the item is in its original condition. Refunds take 5-7 business days to process.',
  'booking instructions': 'To make a booking, please provide your full name, preferred date, and time. You can also book directly through our website.',
  'talk to a human': 'I’ll connect you to a human representative.'
};

// ======================
// Twilio webhook endpoint
// ======================
app.post('/webhook', async (req, res) => {
  try {
    console.log('Twilio webhook hit! Body:', JSON.stringify(req.body || {}));

    const userId = req.body.From;
    const userMessage = (req.body.Body || '').toLowerCase().trim();

    // Lookup answer in dictionary
    const reply = qa[userMessage] || "Sorry, I don't understand that yet.";

    // Send reply back to WhatsApp
    await sendWhatsAppMessage(userId, reply);

    // Respond with empty TwiML so Twilio doesn't send "OK"
    res.type('text/xml');
    res.send('<Response></Response>');
  } catch (err) {
    console.error('Error in webhook:', err);
    res.sendStatus(500);
  }
});

// ======================
// Twilio send WhatsApp message function
// ======================
async function sendWhatsAppMessage(to, message) {
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    const params = new URLSearchParams();
    params.append('To', to);
    params.append('From', TWILIO_WHATSAPP_NUMBER);
    params.append('Body', message);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization:
          'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const result = await response.json();
    console.log('Twilio send message response:', result);
  } catch (err) {
    console.error('Error sending WhatsApp message:', err);
  }
}

// ======================
// Start server
// ======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Middleware running on port ${PORT}`));
