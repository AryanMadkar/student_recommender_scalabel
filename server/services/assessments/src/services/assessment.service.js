const Assessment = require('../models/Assessment');
const Question = require('../models/Question');
const Result = require('../models/Result');
const scoringService = require('./scoring.service');

class AssessmentService {
  // Get personalized questions based on user stage
  async getPersonalizedQuestions(stage, userProfile = {}) {
    const limit = parseInt(process.env.MAX_QUESTIONS_PER_ASSESSMENT) || 25;

    // Base query
    const query = {
      stage: stage,
      isActive: true
    };

    // Get questions with varied difficulty
    const easyCount = Math.floor(limit * 0.3);
    const mediumCount = Math.floor(limit * 0.5);
    const hardCount = limit - easyCount - mediumCount;

    const [easyQuestions, mediumQuestions, hardQuestions] = await Promise.all([
      Question.find({ ...query, difficulty: 'easy' }).limit(easyCount),
      Question.find({ ...query, difficulty: 'medium' }).limit(mediumCount),
      Question.find({ ...query, difficulty: 'hard' }).limit(hardCount)
    ]);

    const allQuestions = [...easyQuestions, ...mediumQuestions, ...hardQuestions];

    // Shuffle questions
    return this.shuffleArray(allQuestions);
  }

  // Submit assessment and calculate results
  async submitAssessment(userId, assessmentId, responses, timeSpent) {
    const assessment = await Assessment.findById(assessmentId).populate('questions.questionId');

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    // Get all questions
    const questions = assessment.questions.map(q => q.questionId);

    // Map responses with weights
    const weightedResponses = responses.map(resp => {
      const assessmentQuestion = assessment.questions.find(
        q => q.questionId._id.toString() === resp.questionId.toString()
      );
      return {
        ...resp,
        weight: assessmentQuestion?.weight || 1
      };
    });

    // Calculate scores
    const scores = scoringService.calculateScores(questions, weightedResponses);

    // Analyze results
    const analysis = this.analyzeResults(scores, questions, weightedResponses);

    // Determine if passed
    const isPassed = scores.overall >= assessment.passingScore;

    // Save result
    const result = new Result({
      userId,
      assessmentId,
      responses: weightedResponses.map(r => ({
        questionId: r.questionId,
        answer: r.answer,
        timeSpent: r.timeSpent || 0
      })),
      scores,
      analysis,
      totalTimeSpent: timeSpent,
      isPassed
    });

    await result.save();

    return {
      resultId: result._id,
      scores,
      analysis,
      isPassed,
      passingScore: assessment.passingScore
    };
  }

  // Analyze assessment results
  analyzeResults(scores, questions, responses) {
    const analysis = {
      strengths: [],
      weaknesses: [],
      recommendations: [],
      learningStyle: scoringService.determineLearningStyle(scores),
      personalityType: scoringService.determinePersonalityType(scores)
    };

    // Identify strengths (scores > 75)
    Object.entries(scores).forEach(([category, score]) => {
      if (category !== 'overall' && score > 75) {
        analysis.strengths.push({
          category: this.capitalizeFirst(category),
          score,
          description: this.getCategoryDescription(category, 'strength')
        });
      }
    });

    // Identify weaknesses (scores < 50)
    Object.entries(scores).forEach(([category, score]) => {
      if (category !== 'overall' && score < 50) {
        analysis.weaknesses.push({
          category: this.capitalizeFirst(category),
          score,
          description: this.getCategoryDescription(category, 'weakness'),
          improvements: this.getImprovementSuggestions(category)
        });
      }
    });

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(scores);

    return analysis;
  }

  // Get category descriptions
  getCategoryDescription(category, type) {
    const descriptions = {
      analytical: {
        strength: 'Excellent problem-solving and logical reasoning abilities',
        weakness: 'May need to develop stronger analytical and critical thinking skills'
      },
      creative: {
        strength: 'Strong creative thinking and innovative problem-solving skills',
        weakness: 'Could benefit from developing more creative and out-of-the-box thinking'
      },
      technical: {
        strength: 'Great aptitude for technical subjects and practical applications',
        weakness: 'May need to strengthen technical and practical skill foundation'
      },
      communication: {
        strength: 'Excellent verbal and written communication abilities',
        weakness: 'Could improve communication and interpersonal skills'
      },
      leadership: {
        strength: 'Natural leadership qualities and team management skills',
        weakness: 'Could develop stronger leadership and team management abilities'
      },
      interest: {
        strength: 'Clear understanding of personal interests and passions',
        weakness: 'Explore more areas to discover hidden interests'
      },
      personality: {
        strength: 'Well-developed personality traits',
        weakness: 'Opportunity to develop diverse personality aspects'
      },
      iq: {
        strength: 'Strong cognitive and reasoning abilities',
        weakness: 'Practice more IQ-based challenges'
      },
      academic: {
        strength: 'Strong academic foundation',
        weakness: 'Focus on improving academic performance'
      }
    };

    return descriptions[category]?.[type] || 'Area for development';
  }

  // Get improvement suggestions
  getImprovementSuggestions(category) {
    const suggestions = {
      analytical: [
        'Practice logical reasoning puzzles daily',
        'Solve mathematical and analytical problems',
        'Take online critical thinking courses'
      ],
      creative: [
        'Engage in creative writing or art projects',
        'Try brainstorming exercises',
        'Explore design thinking methodologies'
      ],
      technical: [
        'Work on hands-on technical projects',
        'Learn programming or technical tools',
        'Join technical workshops'
      ],
      communication: [
        'Practice public speaking',
        'Join debate clubs',
        'Read and write more'
      ],
      leadership: [
        'Take initiative in group projects',
        'Volunteer for leadership roles',
        'Study leadership case studies'
      ],
      interest: [
        'Explore new fields and activities',
        'Take personality assessments',
        'Try different hobbies'
      ],
      personality: [
        'Engage in self-reflection',
        'Seek diverse experiences',
        'Practice emotional intelligence'
      ],
      iq: [
        'Solve IQ puzzles regularly',
        'Practice pattern recognition',
        'Play strategy games'
      ],
      academic: [
        'Focus on fundamentals',
        'Seek academic guidance',
        'Develop study habits'
      ]
    };

    return suggestions[category] || ['Focus on regular practice and improvement'];
  }

  // Generate score-based recommendations
  generateRecommendations(scores) {
    const recommendations = [];

    // High analytical + technical
    if (scores.analytical > 75 && scores.technical > 75) {
      recommendations.push('Consider Engineering or Technology fields');
    }

    // High creative + communication
    if (scores.creative > 75 && scores.communication > 75) {
      recommendations.push('Explore Creative fields like Design, Media, or Arts');
    }

    // High leadership + communication
    if (scores.leadership > 75 && scores.communication > 75) {
      recommendations.push('Business Management or Entrepreneurship suits you well');
    }

    // Balanced high scores
    const highScoreCount = Object.values(scores).filter(s => s > 75).length;
    if (highScoreCount >= 4) {
      recommendations.push('You have versatile abilities - consider interdisciplinary fields');
    }

    // All categories average
    if (scores.overall >= 60 && scores.overall < 75) {
      recommendations.push('Focus on identifying and developing your strongest area');
    }

    if (recommendations.length === 0) {
      recommendations.push('Complete more assessments for personalized recommendations');
    }

    return recommendations;
  }

  // Utility: Shuffle array
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Utility: Capitalize first letter
  capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}

module.exports = new AssessmentService();
