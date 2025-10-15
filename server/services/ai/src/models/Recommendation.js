const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    stage: {
        type: String,
        enum: ['after10th', 'after12th', 'ongoing'],
        required: true
    },
    type: {
        type: String,
        enum: ['stream', 'career', 'college', 'course', 'skill'],
        required: true
    },
    recommendations: [{
        itemId: mongoose.Schema.Types.ObjectId,
        itemType: String,
        title: String,
        matchPercentage: Number,
        reasoning: String,
        pros: [String],
        cons: [String],
        actionSteps: [String],
        resources: [String]
    }],
    assessmentScores: {
        analytical: Number,
        creative: Number,
        technical: Number,
        communication: Number,
        leadership: Number
    },
    userPreferences: {
        interests: [String],
        strengths: [String],
        location: { city: String, state: String },
        budgetRange: { min: Number, max: Number }
    },
    aiInsights: {
        strengths: [String],
        areasOfImprovement: [String],
        personalityType: String,
        learningStyle: String,
        careerFit: String
    },
    generatedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => Date.now() + 30 * 24 * 60 * 60 * 1000 } // 30 days
}, { timestamps: true });

module.exports = mongoose.model('Recommendation', recommendationSchema);
