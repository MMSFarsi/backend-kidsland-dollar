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
const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:5174', 
  'https://backend-kidsland-dollar.vercel.app',
  'https://frontend-dollar-expense.vercel.app'
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.includes('localhost')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.get('/', (req, res) => {
  res.send(' Kidsland Backend is running successfully!');
});
app.use('/api/transactions', transactionRoutes);
app.use('/api/auth', authRoutes);

// Global Error Handler for better debugging instead of HTML 500s
app.use((err, req, res, next) => {
  console.error("Vercel Global Error:", err);
  res.status(500).json({ 
    message: 'Internal Application Error', 
    details: err.message || err 
  });
});

// MongoDB connection mapping to Vercel env
const dbURI = process.env.MONGODB_URI || 'mongodb+srv://kidsland_1:Kidsland%4012345@cluster0.ptiwh.mongodb.net/kidsland?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(dbURI)
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
}).catch(err => console.error('MongoDB connection error', err));

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel Serverless
module.exports = app;
