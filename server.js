const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const transactionRoutes = require('./routes/transactions');

const authRoutes = require('./routes/auth');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/auth', authRoutes);

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/kidsland')
.then(async () => {
  console.log('Connected to MongoDB');
  
  // Seed admin user
  try {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const admin = new User({ username: 'admin', password: 'admin123' });
      await admin.save();
      console.log('Default Admin user created (admin/admin123)');
    }
  } catch (err) {
    console.error('Failed to seed admin', err);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch((err) => {
  console.error('Failed to connect to MongoDB', err);
});
