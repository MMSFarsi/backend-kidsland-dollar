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
    const { type, amount, description, proofImage, date } = req.body;
    
    const newTransaction = new Transaction({
      type,
      amount: Number(amount),
      description,
      ...(date && { date: new Date(date) }),
      ...(proofImage && { proofImage })
    });

    const savedTransaction = await newTransaction.save();
    res.status(201).json(savedTransaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a transaction (protected via auth middleware)
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Transaction removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
