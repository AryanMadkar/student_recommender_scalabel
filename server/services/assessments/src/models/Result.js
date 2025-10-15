const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  assessmentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Assessment', 
    required: true 
  },
  responses: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    answer: mongoose.Schema.Types.Mixed,
    timeSpent: Number // in seconds
  }],
  scores: {
    overall: Number,
    analytical: Number,
    creative: Number,
    technical: Number,
    communication: Number,
    leadership: Number,
    interest: Number,
    personality: Number,
    iq: Number,
    academic: Number
  },
  analysis: {
    strengths: [{
      category: String,
      score: Number,
      description: String
    }],
    weaknesses: [{
      category: String,
      score: Number,
      description: String,
      improvements: [String]
    }],
    recommendations: [String],
    learningStyle: String,
    personalityType: String
  },
  totalTimeSpent: Number,
  completedAt: { type: Date, default: Date.now },
  isPassed: Boolean
}, { timestamps: true });

// Indexes
resultSchema.index({ userId: 1, completedAt: -1 });
resultSchema.index({ assessmentId: 1 });

module.exports = mongoose.model('Result', resultSchema);
