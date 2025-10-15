// Scoring and matching utilities

class Scorer {
  // Normalize scores to 0-100 scale
  static normalizeScore(score, minScore, maxScore) {
    if (maxScore === minScore) return 50;
    return Math.max(0, Math.min(100, ((score - minScore) / (maxScore - minScore)) * 100));
  }

  // Calculate weighted average
  static weightedAverage(scores, weights) {
    if (scores.length !== weights.length) {
      throw new Error('Scores and weights arrays must have same length');
    }

    let totalScore = 0;
    let totalWeight = 0;

    for (let i = 0; i < scores.length; i++) {
      totalScore += scores[i] * weights[i];
      totalWeight += weights[i];
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  // Calculate Euclidean distance for aptitude matching
  static calculateAptitudeMatch(userScores, careerRequirements) {
    const categories = Object.keys(careerRequirements);
    let sumSquaredDiff = 0;

    categories.forEach(category => {
      const userScore = userScores[category] || 50;
      const requiredScore = careerRequirements[category];
      sumSquaredDiff += Math.pow(userScore - requiredScore, 2);
    });

    const distance = Math.sqrt(sumSquaredDiff);
    const maxDistance = Math.sqrt(categories.length * Math.pow(100, 2));
    
    // Convert distance to similarity percentage
    return Math.max(0, 100 - (distance / maxDistance) * 100);
  }

  // Calculate stream suitability based on marks
  static calculateStreamSuitability(subjects, stream) {
    const streamWeights = {
      science: {
        mathematics: 0.3,
        science: 0.3,
        english: 0.1,
        social_science: 0.05,
        hindi: 0.05
      },
      commerce: {
        mathematics: 0.25,
        science: 0.05,
        english: 0.2,
        social_science: 0.15,
        hindi: 0.1
      },
      arts: {
        mathematics: 0.1,
        science: 0.05,
        english: 0.25,
        social_science: 0.3,
        hindi: 0.2
      }
    };

    const weights = streamWeights[stream.toLowerCase()] || {};
    let totalScore = 0;

    subjects.forEach(subject => {
      const normalizedName = subject.name.toLowerCase().replace(/\s+/g, '_');
      const weight = weights[normalizedName] || 0.1;
      const subjectScore = (subject.marks / 100) * 100;
      totalScore += subjectScore * weight;
    });

    return Math.round(totalScore);
  }

  // Calculate college affordability score
  static calculateAffordabilityScore(collegeFees, userBudget) {
    if (!userBudget || !userBudget.max) return 50;

    if (collegeFees <= userBudget.min) {
      return 100; // Very affordable
    } else if (collegeFees <= userBudget.max) {
      // Linear scale within budget range
      const range = userBudget.max - userBudget.min;
      const position = collegeFees - userBudget.min;
      return 100 - (position / range) * 30; // 100 to 70
    } else if (collegeFees <= userBudget.max * 1.2) {
      // Slightly above budget
      return 50;
    } else {
      // Too expensive
      return 20;
    }
  }

  // Calculate ROI (Return on Investment) for college
  static calculateCollegeROI(fees, averagePackage, placementPercentage) {
    if (!fees || !averagePackage || !placementPercentage) return 50;

    const totalFees = fees * 4; // Assuming 4-year course
    const expectedSalary = averagePackage * (placementPercentage / 100);
    
    // Years to recover investment
    const recoveryYears = totalFees / expectedSalary;

    if (recoveryYears <= 1) return 100;
    if (recoveryYears <= 2) return 90;
    if (recoveryYears <= 3) return 75;
    if (recoveryYears <= 4) return 60;
    if (recoveryYears <= 5) return 45;
    return 30;
  }

  // Match percentage with reasoning
  static generateMatchScore(components) {
    const weights = {
      aptitude: 0.3,
      stream: 0.2,
      interests: 0.2,
      skills: 0.15,
      location: 0.15
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.keys(components).forEach(key => {
      if (weights[key]) {
        totalScore += components[key] * weights[key];
        totalWeight += weights[key];
      }
    });

    return Math.round(totalScore / totalWeight);
  }
}

module.exports = Scorer;
