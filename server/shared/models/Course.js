const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shortName: String,
  
  type: {
    type: String,
    enum: ['Bachelor', 'Master', 'Diploma', 'Certificate', 'PhD'],
    required: true
  },
  
  category: {
    type: String,
    enum: ['Engineering', 'Medical', 'Commerce', 'Arts', 'Science', 'Law', 'Management'],
    required: true
  },
  
  specializations: [String],
  duration: { type: String, required: true }, // "4 years", "2 years"
  
  eligibility: {
    academicRequirement: String,
    minimumMarks: Number,
    requiredSubjects: [String],
    entranceExams: [String],
    ageLimit: { min: Number, max: Number }
  },
  
  curriculum: [{
    semester: Number,
    subjects: [String],
    practicals: [String],
    projects: [String]
  }],
  
  careerProspects: [{
    jobRole: String,
    averageSalary: Number,
    industries: [String]
  }],
  
  skills: {
    technical: [String],
    soft: [String],
    tools: [String]
  },
  
  colleges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'College' }],
  
  statistics: {
    averagePlacement: Number,
    averagePackage: Number,
    topRecruiters: [String]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
