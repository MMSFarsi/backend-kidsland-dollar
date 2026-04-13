const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const { GoogleGenerativeAI } = require('@google/generative-ai');

router.post('/', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: "No message provided" });

    // Validate API Key exists
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ 
        message: "SYSTEM ERROR: You have not added your 'GEMINI_API_KEY' to your Vercel Environment Variables yet! Please add it to talk to the AI." 
      });
    }

    // 1. Fetch raw Database context for RAG
    // Sort oldest first so the AI understands timeline
    const transactions = await Transaction.find().sort({ date: 1 });
    
    // Compressing to save context window tokens
    const compressedDb = transactions.map(t => 
      `{${t.date.toISOString().split('T')[0]},${t.type},${t.amount},"${t.description}"}`
    ).join(' | ');

    const systemPrompt = `You are the Expert Financial AI Accountant for the business "Kidsland". 
    You are speaking directly to the business owner. Be incredibly professional, very concise, and use dollar signs.
    Below is a highly compressed comma-separated dump of their actual MongoDB live accounting database.
    Format: {Date, Type(income/expense), Amount, Description}
    DATABASE: [ ${compressedDb} ]
    
    Strictly answer the owner's questions using ONLY the math and data from this context provided above. Address them respectfully. Keep answers under 3 paragraphs.`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt 
    });

    const result = await model.generateContent(message);
    const aiResponse = result.response.text();

    res.json({ reply: aiResponse });
  } catch (err) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ message: "AI processing failed. Check your API key or server logs.", details: err.message });
  }
});

module.exports = router;
