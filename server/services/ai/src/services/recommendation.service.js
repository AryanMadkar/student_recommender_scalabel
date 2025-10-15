const Recommendation = require('../models/Recommendation');
const streamService = require('./stream.service');
const careerService = require('./career.service');
const collegeService = require('./college.service');

class RecommendationService {
    // Get or create comprehensive recommendations
    async getComprehensiveRecommendations(userId, studentData) {
        try {
            // Check for existing recent recommendation
            const existingRec = await Recommendation.findOne({
                userId,
                stage: studentData.stage,
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
            }).sort({ createdAt: -1 });

            if (existingRec) {
                return {
                    cached: true,
                    recommendation: existingRec
                };
            }

            // Generate new recommendations based on stage
            let recommendations;

            if (studentData.stage === 'after10th') {
                recommendations = await streamService.getStreamRecommendations(userId, studentData);
            } else if (studentData.stage === 'after12th') {
                recommendations = await careerService.getCareerRecommendations(userId, studentData);
            } else {
                // For ongoing students
                recommendations = await careerService.getCareerRecommendations(userId, studentData);
            }

            return {
                cached: false,
                recommendation: recommendations
            };
        } catch (error) {
            console.error('Comprehensive recommendation error:', error);
            throw error;
        }
    }

    // Get user's recommendation history
    async getRecommendationHistory(userId) {
        return await Recommendation.find({ userId })
            .sort({ createdAt: -1 })
            .limit(10);
    }

    // Update recommendation feedback
    async provideFeedback(userId, recommendationId, feedback) {
        const recommendation = await Recommendation.findOne({
            _id: recommendationId,
            userId
        });

        if (!recommendation) {
            throw new Error('Recommendation not found');
        }

        // Store feedback (you can add a feedback field to schema)
        recommendation.feedback = feedback;
        await recommendation.save();

        return recommendation;
    }
}

module.exports = new RecommendationService();
