class Helpers {
  // Format time in minutes and seconds
  static formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  // Calculate percentage
  static calculatePercentage(obtained, total) {
    if (total === 0) return 0;
    return Math.round((obtained / total) * 100);
  }

  // Get performance label
  static getPerformanceLabel(score) {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Average';
    if (score >= 40) return 'Below Average';
    return 'Needs Improvement';
  }

  // Get category emoji
  static getCategoryEmoji(category) {
    const emojis = {
      analytical: '🧮',
      creative: '🎨',
      technical: '⚙️',
      communication: '💬',
      leadership: '👑',
      interest: '⭐',
      personality: '🎭',
      iq: '🧠',
      academic: '📚'
    };
    return emojis[category] || '📊';
  }

  // Generate random ID
  static generateId(length = 8) {
    return Math.random().toString(36).substr(2, length);
  }

  // Validate responses
  static validateResponses(responses, questions) {
    const errors = [];

    if (responses.length !== questions.length) {
      errors.push('Response count does not match question count');
    }

    responses.forEach((response, index) => {
      if (!response.questionId) {
        errors.push(`Response ${index + 1}: Missing question ID`);
      }
      if (response.answer === undefined || response.answer === null) {
        errors.push(`Response ${index + 1}: Missing answer`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  // Shuffle array
  static shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Capitalize first letter
  static capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

module.exports = Helpers;
