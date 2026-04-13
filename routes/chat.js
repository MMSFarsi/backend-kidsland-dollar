const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Groq = require('groq-sdk');

router.post('/', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: "No message provided" });

    // Validate API Key exists
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ 
        message: "SYSTEM ERROR: You have not added your 'GROQ_API_KEY' to your Vercel Environment Variables yet! Please add it to talk to the AI." 
      });
    }

    // 1. Fetch raw Database context for RAG
    const transactions = await Transaction.find().sort({ date: 1 });
    
    const compressedDb = transactions.map(t => 
      `{${t.date.toISOString().split('T')[0]},${t.type},${t.amount},"${t.description}"}`
    ).join(' | ');

    const systemPrompt = `You are the Expert Financial AI Accountant for the business "Kidsland". 
    You are speaking directly to the business owner. Be incredibly professional, very concise, and use dollar signs.
    Below is a highly compressed comma-separated dump of their actual MongoDB live accounting database.
    Format: {Date, Type(income/expense), Amount, Description}
    DATABASE: [ ${compressedDb} ]
    
    Strictly answer the owner's questions using ONLY the math and data from this context provided above. Address them respectfully. Keep answers under 3 paragraphs.`;

    const groq = new Groq({ apiKey });

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      model: 'llama-3.3-70b-versatile',
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || "No response generated.";

    res.json({ reply: aiResponse });
  } catch (err) {
    console.error("Groq API Error:", err);
    res.status(500).json({ message: "AI processing failed. Check your API key or server logs.", details: err.message });
  }
});

module.exports = router;
