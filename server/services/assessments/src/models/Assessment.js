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
    enum: ['aptitude', 'interest', 'iq', 'personality', 'comprehensive'],
    required: true
  },
  questions: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    weight: { type: Number, default: 1 }
  }],
  duration: Number, // in seconds
  passingScore: { type: Number, default: 40 },
  instructions: [String],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Indexes
assessmentSchema.index({ stage: 1, type: 1, isActive: 1 });

module.exports = mongoose.model('Assessment', assessmentSchema);
