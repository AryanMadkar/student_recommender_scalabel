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
    duration: { type: String, required: true },
    eligibility: {
        academicRequirement: String,
        minimumMarks: Number,
        requiredSubjects: [String],
        entranceExams: [String],
        stream: { type: String, enum: ['Science', 'Commerce', 'Arts', 'Any'] }
    },
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
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
