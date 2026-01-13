// index.js
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// ======================
// Environment variables
// ======================
const VOICEFLOW_PROJECT_ID = '695ffafd389c1d47f6201717';
const VOICEFLOW_API_KEY = process.env.VOICEFLOW_API_KEY; // Set in Render

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID; // Set in Render
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;   // Set in Render
const TWILIO_WHATSAPP_NUMBER = 'whatsapp:+14155238886';    // Twilio Sandbox

// ======================
// Webhook for Twilio WhatsApp
// ======================
app.post('/webhook', async (req, res) => {
  try {
    // ----------------------
    // 1️⃣ Log incoming Twilio message safely
    // ----------------------
    console.log('Twilio webhook hit! Body:', JSON.stringify(req.body || {}));

    const userId = req.body.From;
    const userMessage = req.body.Body;

    // ----------------------
    // 2️⃣ Call Voiceflow Runtime API
    // ----------------------
    const vfResponse = await fetch(
      `https://general-runtime.voiceflow.com/state/$
