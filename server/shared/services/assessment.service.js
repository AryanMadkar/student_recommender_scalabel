const Assessment = require("../models/Assessment");
const Question = require("../models/Question");
const Result = require("../models/Result");

class AssessmentService {
  // Generate personalized questions based on user profile
  async generatePersonalizedQuestions(assessment, user) {
    const allQuestions = await Question.find({
      _id: { $in: assessment.questions.map((q) => q.questionId) },
      stage: { $in: [user.educationStage] },
    });

    // Adaptive question selection based on user profile
    let personalizedQuestions = [];

    // Always include core questions
    const coreQuestions = allQuestions
      .filter((q) => q.difficulty === "medium")
      .slice(0, 15);
    personalizedQuestions.push(...coreQuestions);

    // Add easier questions if user is struggling or advanced if excelling
    if (
      user.academicInfo?.class12?.percentage &&
      user.academicInfo.class12.percentage < 70
    ) {
      const easyQuestions = allQuestions
        .filter((q) => q.difficulty === "easy")
        .slice(0, 5);
      personalizedQuestions.push(...easyQuestions);
    } else if (user.academicInfo?.class12?.percentage > 85) {
      const hardQuestions = allQuestions
        .filter((q) => q.difficulty === "hard")
        .slice(0, 5);
      personalizedQuestions.push(...hardQuestions);
    }

    // Shuffle questions
    return this.shuffleArray(personalizedQuestions).slice(0, 25);
  }

  // FIXED: Calculate comprehensive scores with proper per-category normalization
  async calculateScores(assessmentId, responses) {
    const assessment = await Assessment.findById(assessmentId).populate(
      "questions.questionId"
    );

    const scores = {
      analytical: 0,
      creative: 0,
      technical: 0,
      communication: 0,
      leadership: 0,
      overall: 0,
    };

    // Track weights per category for proper normalization
    const categoryWeights = {
      analytical: 0,
      creative: 0,
      technical: 0,
      communication: 0,
      leadership: 0,
    };

    let totalScore = 0;
    let totalWeight = 0;

    // Process each response
    Object.entries(responses).forEach(([questionId, response]) => {
      const assessmentQuestion = assessment.questions.find(
        (q) => q.questionId._id.toString() === questionId
      );

      if (assessmentQuestion) {
        const question = assessmentQuestion.questionId;
        const weight = assessmentQuestion.weight || 1;
        const questionScore = this.calculateQuestionScore(question, response);

        // Add to category score and track category weight
        if (scores.hasOwnProperty(question.category)) {
          scores[question.category] += questionScore * weight;
          categoryWeights[question.category] += weight;
        }

        totalScore += questionScore * weight;
        totalWeight += weight;
      }
    });

    // FIXED: Normalize scores per category, not globally
    Object.keys(scores).forEach((category) => {
      if (category !== "overall" && categoryWeights[category] > 0) {
        scores[category] = Math.round(
          (scores[category] / categoryWeights[category]) * 100
        );
      }
    });

    scores.overall = Math.round((totalScore / totalWeight) * 100);
    return scores;
  }

  // Calculate score for individual question
  calculateQuestionScore(question, response) {
    switch (question.type) {
      case "multiple_choice":
        const selectedOption = question.options.find(
          (opt) => opt.value === response
        );
        return selectedOption ? selectedOption.weight || 0 : 0;
      case "rating":
        return (parseInt(response) / 5) * 100; // Convert 1-5 scale to 0-100
      case "ranking":
        return this.calculateRankingScore(question, response);
      case "boolean":
        return response === question.correctAnswer ? 100 : 0;
      default:
        return 0;
    }
  }

  // Calculate ranking question score
  calculateRankingScore(question, response) {
    if (!Array.isArray(response) || !question.options) return 0;

    const idealOrder = question.options.sort(
      (a, b) => (b.weight || 0) - (a.weight || 0)
    );
    const userOrder = response;
    let score = 0;

    userOrder.forEach((item, index) => {
      const idealIndex = idealOrder.findIndex((opt) => opt.value === item);
      const penalty = Math.abs(index - idealIndex);
      score += Math.max(0, 100 - penalty * 20); // Penalize wrong positions
    });

    return userOrder.length > 0 ? score / userOrder.length : 0;
  }

  // Analyze assessment result and provide insights
  async analyzeResult(result) {
    const analysis = {
      strengths: [],
      weaknesses: [],
      recommendations: [],
      personalityInsights: {},
      learningStyle: this.determineLearningStyle(result.scores),
    };

    // Identify strengths (scores > 75)
    Object.entries(result.scores).forEach(([category, score]) => {
      if (category !== "overall" && score > 75) {
        analysis.strengths.push({
          category: this.capitalizeFirst(category),
          score,
          description: this.getCategoryDescription(category, "strength"),
        });
      }
    });

    // Identify weaknesses (scores < 50)
    Object.entries(result.scores).forEach(([category, score]) => {
      if (category !== "overall" && score < 50) {
        analysis.weaknesses.push({
          category: this.capitalizeFirst(category),
          score,
          description: this.getCategoryDescription(category, "weakness"),
          improvement: this.getImprovementSuggestions(category),
        });
      }
    });

    // Generate recommendations based on score patterns
    analysis.recommendations = this.generateScoreBasedRecommendations(
      result.scores
    );

    return analysis;
  }

  // Determine learning style based on scores
  determineLearningStyle(scores) {
    const categoryScores = Object.entries(scores).filter(
      ([key]) => key !== "overall"
    );
    const highestScore = Math.max(...categoryScores.map(([, score]) => score));
    const dominantCategory = categoryScores.find(
      ([, score]) => score === highestScore
    )?.[0];

    const learningStyles = {
      analytical: "Logical Thinker - Prefers structured, step-by-step learning",
      creative:
        "Visual Learner - Benefits from creative and imaginative approaches",
      technical: "Hands-on Learner - Learns best through practical application",
      communication:
        "Social Learner - Thrives in collaborative learning environments",
      leadership:
        "Goal-oriented Learner - Motivated by challenges and leadership roles",
    };

    return learningStyles[dominantCategory] || "Balanced Learner";
  }

  // Get category descriptions
  getCategoryDescription(category, type) {
    const descriptions = {
      analytical: {
        strength: "Excellent problem-solving and logical reasoning abilities",
        weakness:
          "May need to develop stronger analytical and critical thinking skills",
      },
      creative: {
        strength:
          "Strong creative thinking and innovative problem-solving skills",
        weakness:
          "Could benefit from developing more creative and out-of-the-box thinking",
      },
      technical: {
        strength:
          "Great aptitude for technical subjects and practical applications",
        weakness:
          "May need to strengthen technical and practical skill foundation",
      },
      communication: {
        strength: "Excellent verbal and written communication abilities",
        weakness: "Could improve communication and interpersonal skills",
      },
      leadership: {
        strength: "Natural leadership qualities and team management skills",
        weakness:
          "Could develop stronger leadership and team management abilities",
      },
    };

    return descriptions[category]?.[type] || "Area requiring attention";
  }

  // Get improvement suggestions
  getImprovementSuggestions(category) {
    const suggestions = {
      analytical: [
        "Practice logical reasoning puzzles daily",
        "Take online courses in critical thinking",
        "Solve mathematical problems regularly",
      ],
      creative: [
        "Engage in creative writing exercises",
        "Try art or design projects",
        "Participate in brainstorming sessions",
      ],
      technical: [
        "Work on hands-on projects",
        "Learn programming or technical skills",
        "Join technical workshops or labs",
      ],
      communication: [
        "Practice public speaking",
        "Join debate clubs or discussion groups",
        "Read more books and articles",
      ],
      leadership: [
        "Take initiative in group projects",
        "Volunteer for leadership roles",
        "Study successful leadership examples",
      ],
    };

    return (
      suggestions[category] || [
        "Focus on regular practice and skill development",
      ]
    );
  }

  // Generate recommendations based on score patterns
  generateScoreBasedRecommendations(scores) {
    const recommendations = [];

    // High analytical + technical scores
    if (scores.analytical > 75 && scores.technical > 75) {
      recommendations.push("Consider engineering or technology-related fields");
    }

    // High creative + communication scores
    if (scores.creative > 75 && scores.communication > 75) {
      recommendations.push(
        "Explore creative fields like design, media, or arts"
      );
    }

    // High leadership + communication scores
    if (scores.leadership > 75 && scores.communication > 75) {
      recommendations.push(
        "Business management or entrepreneurship might be suitable"
      );
    }

    // Balanced high scores
    const highScoreCount = Object.values(scores).filter(
      (score) => score > 75
    ).length;
    if (highScoreCount >= 3) {
      recommendations.push(
        "You have versatile abilities - consider interdisciplinary fields"
      );
    }

    return recommendations;
  }

  // Utility functions
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}

module.exports = new AssessmentService();
