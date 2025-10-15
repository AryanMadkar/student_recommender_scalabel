const User = require('../models/User');
const Assessment = require('../models/Assessment');
const Result = require('../models/Result');
const Recommendation = require('../models/Recommendation');

class AnalyticsService {
  // User engagement analytics
  async getUserEngagementStats() {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          avgProfileCompletion: { $avg: '$progress.profileCompletion' },
          avgAssessmentsCompleted: { $avg: '$progress.assessmentsCompleted' },
          activeUsers: {
            $sum: {
              $cond: [
                { $gte: ['$progress.lastActive', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    return stats[0] || {};
  }

  // Assessment performance analytics
  async getAssessmentAnalytics() {
    const assessmentStats = await Result.aggregate([
      {
        $group: {
          _id: '$assessmentId',
          totalAttempts: { $sum: 1 },
          avgOverallScore: { $avg: '$scores.overall' },
          avgTimeSpent: { $avg: '$totalTimeSpent' },
          completionRate: { $sum: 1 } // This would need more complex logic for actual completion rate
        }
      },
      {
        $lookup: {
          from: 'assessments',
          localField: '_id',
          foreignField: '_id',
          as: 'assessment'
        }
      },
      {
        $unwind: '$assessment'
      },
      {
        $project: {
          assessmentTitle: '$assessment.title',
          assessmentType: '$assessment.type',
          totalAttempts: 1,
          avgOverallScore: 1,
          avgTimeSpent: 1,
          completionRate: 1
        }
      }
    ]);

    return assessmentStats;
  }

  // Score distribution analytics
  async getScoreDistribution() {
    const distribution = await Result.aggregate([
      {
        $project: {
          scoreRange: {
            $switch: {
              branches: [
                { case: { $gte: ['$scores.overall', 90] }, then: '90-100' },
                { case: { $gte: ['$scores.overall', 80] }, then: '80-89' },
                { case: { $gte: ['$scores.overall', 70] }, then: '70-79' },
                { case: { $gte: ['$scores.overall', 60] }, then: '60-69' },
                { case: { $gte: ['$scores.overall', 50] }, then: '50-59' }
              ],
              default: 'Below 50'
            }
          },
          category: '$assessmentId' // Would need to populate assessment type
        }
      },
      {
        $group: {
          _id: '$scoreRange',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    return distribution;
  }

  // Recommendation effectiveness analytics
  async getRecommendationAnalytics() {
    const recStats = await Recommendation.aggregate([
      {
        $group: {
          _id: '$type',
          totalRecommendations: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' },
          feedbackCount: {
            $sum: {
              $cond: [{ $ne: ['$feedback.helpful', null] }, 1, 0]
            }
          },
          positiveRatings: {
            $sum: {
              $cond: [{ $gte: ['$feedback.rating', 4] }, 1, 0]
            }
          }
        }
      }
    ]);

    return recStats;
  }

  // User journey analytics
  async getUserJourneyAnalytics(userId) {
    const user = await User.findById(userId);
    const results = await Result.find({ userId }).sort({ completedAt: 1 });
    const recommendations = await Recommendation.find({ userId }).sort({ createdAt: 1 });

    const journey = {
      registrationDate: user.createdAt,
      profileCompletion: user.progress.profileCompletion,
      totalAssessments: results.length,
      assessmentTimeline: results.map(r => ({
        date: r.completedAt,
        assessment: r.assessmentId,
        score: r.scores.overall
      })),
      recommendationHistory: recommendations.map(r => ({
        date: r.createdAt,
        type: r.type,
        count: r.recommendations.length,
        confidence: r.confidence
      })),
      engagementPattern: this.calculateEngagementPattern(user, results),
      progressTrend: this.calculateProgressTrend(results)
    };

    return journey;
  }

  // Calculate user engagement pattern
  calculateEngagementPattern(user, results) {
    const daysSinceRegistration = Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24));
    const assessmentsPerDay = results.length / Math.max(daysSinceRegistration, 1);
    
    let pattern;
    if (assessmentsPerDay >= 1) pattern = 'Highly Active';
    else if (assessmentsPerDay >= 0.3) pattern = 'Regular User';
    else if (assessmentsPerDay >= 0.1) pattern = 'Occasional User';
    else pattern = 'Low Activity';

    return {
      pattern,
      assessmentsPerDay: assessmentsPerDay.toFixed(2),
      daysSinceRegistration,
      lastActiveDay: user.progress.lastActive
    };
  }

  // Calculate progress trend
  calculateProgressTrend(results) {
    if (results.length < 2) return 'Insufficient Data';

    const scores = results.map(r => r.scores.overall);
    const firstHalf = scores.slice(0, Math.ceil(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const improvement = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (improvement > 10) return 'Improving';
    else if (improvement < -10) return 'Declining';
    else return 'Stable';
  }

  // Generate user insights report
  async generateUserInsights(userId) {
    const [journey, user] = await Promise.all([
      this.getUserJourneyAnalytics(userId),
      User.findById(userId)
    ]);

    const insights = {
      summary: {
        stage: user.educationStage,
        profileCompletion: user.progress.profileCompletion,
        assessmentsCompleted: journey.totalAssessments,
        engagementLevel: journey.engagementPattern.pattern
      },
      
      strengths: this.identifyUserStrengths(journey),
      recommendations: this.generatePersonalizedInsights(journey, user),
      nextSteps: this.suggestNextSteps(journey, user),
      
      performance: {
        averageScore: this.calculateAverageScore(journey.assessmentTimeline),
        progressTrend: journey.progressTrend,
        consistencyScore: this.calculateConsistencyScore(journey.assessmentTimeline)
      }
    };

    return insights;
  }

  // Identify user strengths from assessment history
  identifyUserStrengths(journey) {
    const strengths = [];
    
    if (journey.totalAssessments >= 5) {
      strengths.push('Assessment Engagement - You actively participate in self-evaluation');
    }
    
    if (journey.progressTrend === 'Improving') {
      strengths.push('Continuous Improvement - Your scores show positive growth');
    }
    
    if (journey.engagementPattern.pattern === 'Highly Active') {
      strengths.push('High Engagement - You consistently use the platform');
    }

    return strengths;
  }

  // Generate personalized insights
  generatePersonalizedInsights(journey, user) {
    const insights = [];
    
    if (journey.totalAssessments < 3) {
      insights.push({
        type: 'action',
        message: 'Complete more assessments for comprehensive analysis',
        priority: 'high'
      });
    }
    
    if (journey.progressTrend === 'Declining') {
      insights.push({
        type: 'concern',
        message: 'Recent assessment scores show decline - consider reviewing preparation strategy',
        priority: 'medium'
      });
    }
    
    if (user.progress.profileCompletion < 80) {
      insights.push({
        type: 'improvement',
        message: 'Complete your profile for more accurate recommendations',
        priority: 'medium'
      });
    }

    return insights;
  }

  // Suggest next steps
  suggestNextSteps(journey, user) {
    const steps = [];
    
    // Stage-specific next steps
    switch (user.educationStage) {
      case 'after10th':
        steps.push('Explore stream-specific assessments');
        steps.push('Research colleges in your preferred stream');
        break;
      case 'after12th':
        steps.push('Take entrance exam preparation assessments');
        steps.push('Finalize college application list');
        break;
      case 'ongoing':
        steps.push('Complete skill-based assessments');
        steps.push('Explore internship opportunities');
        break;
    }
    
    // General next steps based on progress
    if (journey.recommendationHistory.length === 0) {
      steps.unshift('Generate your first set of recommendations');
    }
    
    return steps;
  }

  // Calculate average score
  calculateAverageScore(assessmentTimeline) {
    if (assessmentTimeline.length === 0) return 0;
    
    const total = assessmentTimeline.reduce((sum, assessment) => sum + assessment.score, 0);
    return Math.round(total / assessmentTimeline.length);
  }

  // Calculate consistency score
  calculateConsistencyScore(assessmentTimeline) {
    if (assessmentTimeline.length < 2) return 100;
    
    const scores = assessmentTimeline.map(a => a.score);
    const mean = scores.reduce((a, b) => a + b) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation means more consistency
    // Convert to 0-100 scale where 100 is most consistent
    const consistencyScore = Math.max(0, 100 - (stdDev * 2));
    
    return Math.round(consistencyScore);
  }
}

module.exports = new AnalyticsService();
