const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const VOICEFLOW_PROJECT_ID = '695ffafd389c1d47f6201717';
const VOICEFLOW_API_KEY = process.env.VOICEFLOW_API_KEY;

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = 'whatsapp:+14155238886';

app.post('/webhook', async (req, res) => {
  try {
    console.log('Twilio webhook hit! Body:', JSON.stringify(req.body || {}));

    const userId = req.body.From;
    const userMessage = req.body.Body;

    const vfResponse = await fetch(
      `https://general-runtime.voiceflow.com/state/${VOICEFLOW_PROJECT_ID}/user/${encodeURIComponent(userId)}/interact`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VOICEFLOW_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'text', payload: { message: userMessage } }),
      }
    );

    const data = await vfResponse.json();
    console.log('Voiceflow raw response:', JSON.stringify(data || {}));

    const traceItems = Array.isArray(data) ? data : data.trace || [];
    let reply = 'No response from Voiceflow.';

    for (const item of traceItems) {
      if (item.type === 'text' && item.payload?.message) {
        reply = item.payload.message;
        break;
      }
      if (item.type === 'speak' && item.payload?.text) {
        reply = item.payload.text;
        break;
      }
    }

    await sendWhatsAppMessage(userId, reply);

    res.sendStatus(200);
  } catch (err) {
    console.error('Error in webhook:', err);
    res.sendStatus(500);
  }
});

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Middleware running on port ${PORT}`));
