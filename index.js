const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const VOICEFLOW_PROJECT_ID = '695ffafd389c1d47f6201717';
const VOICEFLOW_API_KEY = process.env.VOICEFLOW_API_KEY; // set this in Render

app.post('/webhook', async (req, res) => {
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
      body: JSON.stringify({ type: 'text', payload: userMessage }),
    }
  );

  const data = await vfResponse.json();
  const reply = data[0]?.payload?.message || 'No response from Voiceflow.';

  res.set('Content-Type', 'text/xml');
  res.send(`<Response><Message>${reply}</Message></Response>`);
});

app.listen(3000, () => console.log('Middleware running'));
