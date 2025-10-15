const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  type: {
    type: String,
    enum: ['career', 'college', 'course', 'skill', 'roadmap'],
    required: true
  },
  
  stage: {
    type: String,
    enum: ['after10th', 'after12th', 'ongoing'],
    required: true
  },
  
  recommendations: [{
    title: String,
    description: String,
    matchPercentage: Number,
    reasoning: String,
    priority: { type: Number, min: 1, max: 5 },
    
    // For college recommendations
    college: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    
    // For career recommendations
    career: { type: mongoose.Schema.Types.ObjectId, ref: 'Career' },
    
    // Additional data
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  aiGeneratedInsights: {
    summary: String,
    keyPoints: [String],
    actionSteps: [String],
    timeline: String
  },
  
  confidence: { type: Number, min: 0, max: 100 },
  expiresAt: Date,
  
  feedback: {
    helpful: Boolean,
    rating: { type: Number, min: 1, max: 5 },
    comments: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Recommendation', recommendationSchema);
