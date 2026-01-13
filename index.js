const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.post('/webhook', async (req, res) => {
  console.log('Twilio webhook hit! Body:', req.body);

// ✅ Use environment variable for security
const VOICEFLOW_PROJECT_ID = '695ffafd389c1d47f6201717';
const VOICEFLOW_API_KEY = process.env.VOICEFLOW_API_KEY;

app.post('/webhook', async (req, res) => {
  const userId = req.body.From;
  const userMessage = req.body.Body;

  // 1️⃣ Respond immediately to Twilio
  res.set('Content-Type', 'text/xml');
  res.send(`
    <Response>
      <Message>Processing your message...</Message>
    </Response>
  `);

  // 2️⃣ Call Voiceflow asynchronously
  try {
    const vfResponse = await fetch(
      `https://general-runtime.voiceflow.com/state/${VOICEFLOW_PROJECT_ID}/user/${encodeURIComponent(userId)}/interact`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VOICEFLOW_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'text',
          payload: { message: userMessage }, // ✅ Correct format
        }),
      }
    );

    const data = await vfResponse.json();

    // 3️⃣ Handle both possible response formats safely
    const trace = Array.isArray(data) ? data : data.trace || [];

    let reply = 'No response from Voiceflow.';
    for (const item of trace) {
      if (item.type === 'text' && item.payload?.message) {
        reply = item.payload.message;
        break;
      }
      if (item.type === 'speak' && item.payload?.text) {
        reply = item.payload.text;
        break;
      }
    }

    // 4️⃣ Send follow-up WhatsApp message
    await sendWhatsAppMessage(userId, reply);

  } catch (err) {
    console.error('Voiceflow error:', err);
    await sendWhatsAppMessage(userId, 'Sorry, something went wrong.');
  }
});

// Twilio send message function
async function sendWhatsAppMessage(to, message) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = 'whatsapp:+14155238886'; // Twilio sandbox number

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const params = new URLSearchParams();
  params.append('To', to);
  params.append('From', from);
  params.append('Body', message);

  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization:
        'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
}

// ✅ Listen on Render port or default 3000
app.listen(process.env.PORT || 3000, () => console.log('Middleware running'));
