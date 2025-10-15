require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const assessmentRoutes = require('./routes/assessment.routes');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    service: 'Assessment Service',
    version: '1.0',
    features: ['Adaptive Testing', 'Multi-category Scoring', 'Stage-specific Assessments']
  });
});

// Routes - Mount directly without /api prefix (gateway handles that)
app.use('/', assessmentRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({ 
    success: false, 
    message: err.message || 'Internal server error' 
  });
});

app.listen(PORT, () => {
  console.log(`📝 Assessment Service running on port ${PORT}`);
  console.log(`🎯 Features: Adaptive Testing, Multi-stage Support`);
});
