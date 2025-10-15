const mongoose = require('mongoose');

const careerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: {
    type: String,
    enum: ['Engineering', 'Medical', 'Business', 'Arts', 'Science', 'Law', 'Design', 'Other'],
    required: true
  },
  description: { type: String, required: true },
  requiredSkills: [{
    skill: String,
    proficiency: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
    importance: { type: Number, min: 1, max: 5 }
  }],
  educationPath: [{
    level: { 
      type: String, 
      enum: ['10+2', 'Bachelor', 'Master', 'PhD', 'Diploma', 'Certificate'] 
    },
    fields: [String],
    duration: String,
    mandatory: { type: Boolean, default: false }
  }],
  salaryRange: {
    entry: { min: Number, max: Number },
    mid: { min: Number, max: Number },
    senior: { min: Number, max: Number }
  },
  jobRoles: [String],
  industries: [String],
  growth: {
    demand: { type: String, enum: ['High', 'Medium', 'Low'] },
    futureScope: String,
    automationRisk: { type: String, enum: ['Low', 'Medium', 'High'] }
  },
  aptitudeMapping: {
    analytical: { type: Number, min: 0, max: 100 },
    creative: { type: Number, min: 0, max: 100 },
    technical: { type: Number, min: 0, max: 100 },
    communication: { type: Number, min: 0, max: 100 },
    leadership: { type: Number, min: 0, max: 100 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Career', careerSchema);
