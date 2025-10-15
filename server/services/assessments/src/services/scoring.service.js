class ScoringService {
  // Calculate score for individual question
  calculateQuestionScore(question, response) {
    switch (question.type) {
      case 'multiple_choice':
        const selectedOption = question.options.find(opt => opt.value === response);
        return selectedOption ? (selectedOption.weight || 0) : 0;
      
      case 'rating':
        // Rating is 1-5, convert to 0-100
        const rating = parseInt(response);
        return isNaN(rating) ? 0 : (rating / 5) * 100;
      
      case 'ranking':
        return this.calculateRankingScore(question, response);
      
      case 'boolean':
        if (question.correctAnswer !== undefined) {
          return response === question.correctAnswer ? 100 : 0;
        }
        // For boolean without correct answer, treat Yes=100, No=0
        return response === true || response === 'true' ? 100 : 50;
      
      case 'text':
        // Text responses don't have automatic scoring
        return 50; // Neutral score
      
      default:
        return 0;
    }
  }

  // Calculate ranking score
  calculateRankingScore(question, response) {
    if (!Array.isArray(response) || !question.options) return 0;

    const idealOrder = question.options
      .sort((a, b) => (b.weight || 0) - (a.weight || 0))
      .map(opt => opt.value);

    let totalPenalty = 0;
    response.forEach((item, index) => {
      const idealIndex = idealOrder.indexOf(item);
      if (idealIndex !== -1) {
        totalPenalty += Math.abs(index - idealIndex);
      }
    });

    const maxPenalty = response.length * (response.length - 1) / 2;
    const score = maxPenalty > 0 ? 100 * (1 - totalPenalty / maxPenalty) : 100;
    return Math.max(0, score);
  }

  // Calculate comprehensive scores per category
  calculateScores(questions, responses) {
    const scores = {
      overall: 0,
      analytical: 0,
      creative: 0,
      technical: 0,
      communication: 0,
      leadership: 0,
      interest: 0,
      personality: 0,
      iq: 0,
      academic: 0
    };

    const categoryWeights = {
      analytical: 0,
      creative: 0,
      technical: 0,
      communication: 0,
      leadership: 0,
      interest: 0,
      personality: 0,
      iq: 0,
      academic: 0
    };

    let totalScore = 0;
    let totalWeight = 0;

    responses.forEach(response => {
      const question = questions.find(q => q._id.toString() === response.questionId.toString());
      
      if (question) {
        const weight = response.weight || 1;
        const questionScore = this.calculateQuestionScore(question, response.answer);

        // Add to category score
        const category = question.category;
        if (scores.hasOwnProperty(category)) {
          scores[category] += questionScore * weight;
          categoryWeights[category] += weight;
        }

        totalScore += questionScore * weight;
        totalWeight += weight;
      }
    });

    // Normalize scores per category
    Object.keys(scores).forEach(category => {
      if (category !== 'overall' && categoryWeights[category] > 0) {
        scores[category] = Math.round((scores[category] / categoryWeights[category]));
      }
    });

    scores.overall = Math.round(totalWeight > 0 ? (totalScore / totalWeight) : 0);

    return scores;
  }

  // Determine learning style based on scores
  determineLearningStyle(scores) {
    const categoryScores = [];
    
    ['analytical', 'creative', 'technical', 'communication', 'leadership'].forEach(cat => {
      if (scores[cat]) {
        categoryScores.push({ category: cat, score: scores[cat] });
      }
    });

    categoryScores.sort((a, b) => b.score - a.score);

    if (categoryScores.length === 0) return 'Balanced Learner';

    const dominant = categoryScores[0].category;

    const styles = {
      analytical: 'Logical Thinker - Prefers structured, step-by-step learning',
      creative: 'Visual Learner - Benefits from creative and imaginative approaches',
      technical: 'Hands-on Learner - Learns best through practical application',
      communication: 'Social Learner - Thrives in collaborative environments',
      leadership: 'Goal-oriented Learner - Motivated by challenges and leadership'
    };

    return styles[dominant] || 'Balanced Learner';
  }

  // Determine personality type
  determinePersonalityType(scores) {
    if (scores.analytical > 75 && scores.technical > 75) {
      return 'Analytical Problem Solver';
    } else if (scores.creative > 75 && scores.communication > 75) {
      return 'Creative Communicator';
    } else if (scores.leadership > 75 && scores.communication > 75) {
      return 'Natural Leader';
    } else if (scores.technical > 75) {
      return 'Technical Specialist';
    } else if (scores.analytical > 75) {
      return 'Logical Thinker';
    } else if (scores.creative > 75) {
      return 'Creative Thinker';
    } else {
      return 'Well-Rounded Individual';
    }
  }
}

module.exports = new ScoringService();
