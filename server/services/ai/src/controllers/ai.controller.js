const recommendationService = require('../services/recommendation.service');

class AIController {
    // Generate comprehensive recommendations
    async generateRecommendations(req, res) {
        try {
            const userId = req.header('user-id');
            const studentData = req.body;

            const result = await recommendationService.getComprehensiveRecommendations(
                userId,
                studentData
            );

            res.json({
                success: true,
                cached: result.cached,
                data: result.recommendation
            });
        } catch (error) {
            console.error('Generate recommendations error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get recommendation history
    async getHistory(req, res) {
        try {
            const userId = req.header('user-id');

            const history = await recommendationService.getRecommendationHistory(userId);

            res.json({
                success: true,
                data: history
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Provide feedback
    async provideFeedback(req, res) {
        try {
            const userId = req.header('user-id');
            const { recommendationId } = req.params;
            const feedback = req.body;

            const updated = await recommendationService.provideFeedback(
                userId,
                recommendationId,
                feedback
            );

            res.json({
                success: true,
                data: updated
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new AIController();
