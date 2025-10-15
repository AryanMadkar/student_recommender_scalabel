const Assessment = require('../models/Assessment');
const Question = require('../models/Question');
const Result = require('../models/Result');
const assessmentService = require('../services/assessment.service');

class AssessmentController {
  // Get all assessments
  async getAssessments(req, res) {
    try {
      const { stage, type } = req.query;
      const userId = req.user.id; // This should now work!

      console.log('Getting assessments for user:', userId);

      const query = { isActive: true };
      if (stage) query.stage = stage;
      if (type) query.type = type;

      const assessments = await Assessment.find(query)
        .select('title description stage type duration passingScore instructions questions')
        .sort({ createdAt: -1 });

      if (!assessments || assessments.length === 0) {
        return res.json({
          success: true,
          count: 0,
          data: [],
          message: 'No assessments found. Please run seed script.'
        });
      }

      // Check which assessments user has completed
      const userResults = await Result.find({ userId }).distinct('assessmentId');
      const completedIds = userResults.map(id => id.toString());

      const assessmentsWithStatus = assessments.map(assessment => ({
        id: assessment._id,
        title: assessment.title,
        description: assessment.description,
        stage: assessment.stage,
        type: assessment.type,
        duration: assessment.duration,
        passingScore: assessment.passingScore,
        instructions: assessment.instructions,
        completed: completedIds.includes(assessment._id.toString()),
        questionCount: assessment.questions?.length || 0
      }));

      res.json({
        success: true,
        count: assessmentsWithStatus.length,
        data: assessmentsWithStatus
      });
    } catch (error) {
      console.error('Get assessments error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Start an assessment
  async startAssessment(req, res) {
    try {
      const { assessmentId } = req.params;
      const userId = req.user.id;

      console.log('Starting assessment:', assessmentId, 'for user:', userId);

      const assessment = await Assessment.findById(assessmentId)
        .populate('questions.questionId');

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Assessment not found'
        });
      }

      // Check if already completed recently
      const existingResult = await Result.findOne({
        userId,
        assessmentId,
        completedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      });

      if (existingResult) {
        return res.status(400).json({
          success: false,
          message: 'You have already completed this assessment recently',
          result: existingResult
        });
      }

      // Get questions
      const questions = assessment.questions.map(q => q.questionId);

      res.json({
        success: true,
        data: {
          assessment: {
            id: assessment._id,
            title: assessment.title,
            description: assessment.description,
            stage: assessment.stage,
            type: assessment.type,
            duration: assessment.duration,
            passingScore: assessment.passingScore,
            instructions: assessment.instructions,
            totalQuestions: questions.length
          },
          questions: questions.map(q => ({
            id: q._id,
            question: q.question,
            type: q.type,
            category: q.category,
            options: q.options,
            difficulty: q.difficulty
          })),
          startedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Start assessment error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Submit assessment
  async submitAssessment(req, res) {
    try {
      const { assessmentId } = req.params;
      const { responses, timeSpent } = req.body;
      const userId = req.user.id;

      if (!responses || responses.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Responses are required'
        });
      }

      const result = await assessmentService.submitAssessment(
        userId,
        assessmentId,
        responses,
        timeSpent
      );

      res.json({
        success: true,
        message: 'Assessment submitted successfully',
        data: result
      });
    } catch (error) {
      console.error('Submit assessment error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get user's results
  async getResults(req, res) {
    try {
      const userId = req.user.id;
      const { stage, limit = 10 } = req.query;

      const query = { userId };

      const results = await Result.find(query)
        .populate({
          path: 'assessmentId',
          select: 'title stage type'
        })
        .sort({ completedAt: -1 })
        .limit(parseInt(limit));

      res.json({
        success: true,
        count: results.length,
        data: results
      });
    } catch (error) {
      console.error('Get results error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get specific result
  async getResultById(req, res) {
    try {
      const { resultId } = req.params;
      const userId = req.user.id;

      const result = await Result.findOne({
        _id: resultId,
        userId
      }).populate('assessmentId');

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Result not found'
        });
      }

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get result error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get statistics
  async getStatistics(req, res) {
    try {
      const userId = req.user.id;

      const results = await Result.find({ userId });

      if (results.length === 0) {
        return res.json({
          success: true,
          data: {
            totalAssessments: 0,
            averageScore: 0,
            message: 'No assessments completed yet'
          }
        });
      }

      const totalScore = results.reduce((sum, r) => sum + r.scores.overall, 0);
      const averageScore = Math.round(totalScore / results.length);

      res.json({
        success: true,
        data: {
          totalAssessments: results.length,
          averageScore,
          recentResults: results.slice(0, 5)
        }
      });
    } catch (error) {
      console.error('Get statistics error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Compare results
  async compareResults(req, res) {
    try {
      const { resultId1, resultId2 } = req.query;
      const userId = req.user.id;

      if (!resultId1 || !resultId2) {
        return res.status(400).json({
          success: false,
          message: 'Two result IDs are required'
        });
      }

      const [result1, result2] = await Promise.all([
        Result.findOne({ _id: resultId1, userId }),
        Result.findOne({ _id: resultId2, userId })
      ]);

      if (!result1 || !result2) {
        return res.status(404).json({
          success: false,
          message: 'One or both results not found'
        });
      }

      res.json({
        success: true,
        data: {
          result1,
          result2,
          improvement: result2.scores.overall - result1.scores.overall
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new AssessmentController();
