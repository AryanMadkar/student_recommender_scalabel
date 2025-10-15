const mongoose = require('mongoose');

const streamGuidanceSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    class10Marks: {
        percentage: Number,
        subjects: [{
            name: String,
            marks: Number
        }]
    },
    recommendedStreams: [{
        stream: { type: String, enum: ['Science', 'Commerce', 'Arts'] },
        subStreams: [String], // PCM, PCB for Science; Accounts, Economics for Commerce
        matchScore: Number,
        reasoning: String,
        subjects: [String],
        careerOptions: [String],
        topColleges: [String],
        entranceExams: [String],
        skills: [String]
    }],
    aiAnalysis: {
        subjectStrengths: [String],
        subjectWeaknesses: [String],
        aptitudeProfile: String,
        suggestedFocus: String
    },
    generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('StreamGuidance', streamGuidanceSchema);
