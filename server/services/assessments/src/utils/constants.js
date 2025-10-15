const ASSESSMENT_TYPES = {
  APTITUDE: 'aptitude',
  INTEREST: 'interest',
  IQ: 'iq',
  PERSONALITY: 'personality',
  COMPREHENSIVE: 'comprehensive'
};

const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  RATING: 'rating',
  RANKING: 'ranking',
  TEXT: 'text',
  BOOLEAN: 'boolean'
};

const CATEGORIES = {
  INTEREST: 'interest',
  ANALYTICAL: 'analytical',
  CREATIVE: 'creative',
  TECHNICAL: 'technical',
  COMMUNICATION: 'communication',
  LEADERSHIP: 'leadership',
  PERSONALITY: 'personality',
  ACADEMIC: 'academic',
  IQ: 'iq'
};

const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

const STAGES = {
  AFTER_10TH: 'after10th',
  AFTER_12TH: 'after12th',
  ONGOING: 'ongoing'
};

const SCORING_THRESHOLDS = {
  EXCELLENT: 85,
  GOOD: 70,
  AVERAGE: 50,
  BELOW_AVERAGE: 40,
  POOR: 0
};

module.exports = {
  ASSESSMENT_TYPES,
  QUESTION_TYPES,
  CATEGORIES,
  DIFFICULTY_LEVELS,
  STAGES,
  SCORING_THRESHOLDS
};
