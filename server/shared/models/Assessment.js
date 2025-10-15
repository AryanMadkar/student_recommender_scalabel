const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  
  stage: {
    type: String,
    enum: ['after10th', 'after12th', 'ongoing'],
    required: true
  },
  
  type: {
    type: String,
    enum: ['aptitude', 'interest', 'iq', 'personality', 'subject_preference'],
    required: true
  },
  
  questions: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    weight: { type: Number, default: 1 }
  }],
  
  duration: Number, // in minutes
  passingScore: Number,
  
  scoringCriteria: {
    categories: [{
      name: String,
      weight: Number,
      questionIds: [mongoose.Schema.Types.ObjectId]
    }]
  },
  
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Assessment', assessmentSchema);
