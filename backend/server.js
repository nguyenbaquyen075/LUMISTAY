const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limits: brute-force on login, abuse of chatbot
const rateLimit = require('express-rate-limit');
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 }));
app.use('/api/chatbot', rateLimit({ windowMs: 60 * 1000, limit: 30 }));
app.use('/api/admin/ai/ask', rateLimit({ windowMs: 60 * 1000, limit: 10 })); // each call spends API credit

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/services', require('./routes/services'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin', require('./routes/ops'));
app.use('/api/config', require('./routes/config'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'LumiStay API is running', timestamp: new Date() });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
    // Seed initial data, then upgrade older data to the current schema
    require('./utils/seeder')().then(() => require('./utils/migrate')()).catch((e) => console.error('startup data error:', e.message));
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️  Starting server without database connection...');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT} (No DB)`);
    });
  });

module.exports = app;
