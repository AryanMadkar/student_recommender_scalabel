require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

// Import routes
const aiRoutes = require('./routes/ai.routes');
const careerRoutes = require('./routes/career.routes');
const collegeRoutes = require('./routes/college.routes');
const streamRoutes = require('./routes/stream.routes');

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    service: 'AI Service',
    version: '2.0',
    ai_providers: ['Groq', 'Gemini']
  });
});

// Routes
app.use('/ai', aiRoutes);
app.use('/careers', careerRoutes);
app.use('/colleges', collegeRoutes);
app.use('/streams', streamRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    success: false, 
    message: err.message || 'Internal server error' 
  });
});

app.listen(PORT, () => {
  console.log(`🤖 AI Service running on port ${PORT}`);
  console.log(`🧠 AI Providers: Groq (Primary), Gemini (Fallback)`);
});
