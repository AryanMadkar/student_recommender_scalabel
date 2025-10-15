const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  
  responses: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    answer: mongoose.Schema.Types.Mixed,
    timeSpent: Number, // in seconds
    confidence: { type: Number, min: 1, max: 5 }
  }],
  
  scores: {
    analytical: { type: Number, default: 0 },
    creative: { type: Number, default: 0 },
    technical: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    leadership: { type: Number, default: 0 },
    overall: { type: Number, default: 0 }
  },
  
  analysis: {
    strengths: [String],
    weaknesses: [String],
    recommendations: [String],
    personalityType: String,
    learningStyle: String
  },
  
  aiInsights: {
    careerFit: [{
      career: String,
      matchPercentage: Number,
      reasoning: String
    }],
    skillGaps: [String],
    developmentAreas: [String]
  },
  
  totalTimeSpent: Number, // in minutes
  completedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Result', resultSchema);
