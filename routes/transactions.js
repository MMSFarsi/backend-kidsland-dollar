const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new transaction (protected via auth middleware)
router.post('/', auth, async (req, res) => {
  try {
    const { type, amount, description, proofImage } = req.body;
    
    const newTransaction = new Transaction({
      type,
      amount: Number(amount),
      description,
      ...(proofImage && { proofImage })
    });

    const savedTransaction = await newTransaction.save();
    res.status(201).json(savedTransaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
