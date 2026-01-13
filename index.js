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

    // ======== Extract messages ========
    let traceItems = [];
    if (Array.isArray(data)) {
      traceItems = data;
    } else if (data?.trace) {
      traceItems = data.trace;
    } else {
      traceItems = [data];
    }

    const messages = traceItems
      .filter(i => (i.type === 'text' && i.payload?.message) || (i.type === 'speak' && i.payload?.text))
      .map(i => i.type === 'text' ? i.payload.message : i.payload.text);

    const reply = messages.join('\n') || 'No response from Voiceflow.';

    // ======== Send WhatsApp reply ========
    await sendWhatsAppMessage(userId, reply);

    res.sendStatus(200);

  } catch (err) {
    console.error('Error in webhook:', err);
    res.sendStatus(500);
  }
});
