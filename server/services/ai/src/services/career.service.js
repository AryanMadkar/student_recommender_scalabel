const Career = require('../models/Career');
const College = require('../models/College');
const Course = require('../models/Course');
const Recommendation = require('../models/Recommendation');
const aiService = require('./ai.service');
const AFTER_12TH_PROMPTS = require('../prompts/after12th.prompts');

class CareerService {
  // Get personalized career recommendations
  async getCareerRecommendations(userId, studentData) {
    try {
      // Calculate aptitude match scores
      const careerMatches = await this.calculateCareerMatches(studentData);

      // Get AI insights
      const systemPrompt = "You are an expert career counselor for Indian students. Provide detailed, practical career guidance in JSON format.";
      
      const userPrompt = AFTER_12TH_PROMPTS.CAREER_RECOMMENDATION
        .replace('{stream}', studentData.stream)
        .replace('{percentage}', studentData.percentage)
        .replace('{class10Percentage}', studentData.class10Percentage || 'N/A')
        .replace('{subjects}', JSON.stringify(studentData.subjects))
        .replace('{analytical}', studentData.assessmentScores?.analytical || 50)
        .replace('{creative}', studentData.assessmentScores?.creative || 50)
        .replace('{technical}', studentData.assessmentScores?.technical || 50)
        .replace('{communication}', studentData.assessmentScores?.communication || 50)
        .replace('{leadership}', studentData.assessmentScores?.leadership || 50)
        .replace('{interests}', studentData.interests?.join(', ') || 'Not specified')
        .replace('{city}', studentData.location.city)
        .replace('{state}', studentData.location.state)
        .replace('{minBudget}', studentData.budget?.min || 50000)
        .replace('{maxBudget}', studentData.budget?.max || 500000);

      const aiResponse = await aiService.analyze(systemPrompt, userPrompt);

      // Merge AI recommendations with database career matches
      const finalRecommendations = await this.mergeRecommendations(
        aiResponse.careers || [],
        careerMatches,
        studentData
      );

      // Save recommendation
      const recommendation = new Recommendation({
        userId,
        stage: 'after12th',
        type: 'career',
        recommendations: finalRecommendations,
        assessmentScores: studentData.assessmentScores,
        userPreferences: {
          interests: studentData.interests,
          strengths: studentData.strengths,
          location: studentData.location,
          budgetRange: studentData.budget
        },
        aiInsights: aiResponse.insights || {}
      });

      await recommendation.save();

      return {
        careers: finalRecommendations,
        insights: aiResponse.insights,
        recommendationId: recommendation._id
      };
    } catch (error) {
      console.error('Career recommendation error:', error);
      throw error;
    }
  }

  // Calculate career matches based on aptitude
  async calculateCareerMatches(studentData) {
    const careers = await Career.find().lean();
    const matches = [];

    careers.forEach(career => {
      let matchScore = 0;
      let totalWeight = 0;

      // Match assessment scores with career aptitude requirements
      if (career.aptitudeMapping) {
        const assessmentScores = studentData.assessmentScores || {};
        
        Object.keys(career.aptitudeMapping).forEach(aptitude => {
          const careerRequirement = career.aptitudeMapping[aptitude];
          const userScore = assessmentScores[aptitude] || 50;
          
          // Calculate difference and convert to match percentage
          const difference = Math.abs(careerRequirement - userScore);
          const aptitudeMatch = Math.max(0, 100 - difference);
          
          matchScore += aptitudeMatch;
          totalWeight += 100;
        });
      }

      // Stream compatibility
      if (studentData.stream) {
        const streamCompatibility = this.checkStreamCompatibility(
          studentData.stream,
          career.educationPath
        );
        matchScore += streamCompatibility * 0.3 * 100;
        totalWeight += 30;
      }

      // Interest alignment
      if (studentData.interests && studentData.interests.length > 0) {
        const interestMatch = this.calculateInterestMatch(
          studentData.interests,
          career.title,
          career.category
        );
        matchScore += interestMatch;
        totalWeight += 100;
      }

      const finalMatchPercentage = totalWeight > 0 ? (matchScore / totalWeight) * 100 : 50;

      if (finalMatchPercentage >= 60) {
        matches.push({
          career,
          matchPercentage: Math.round(finalMatchPercentage)
        });
      }
    });

    // Sort by match percentage
    return matches.sort((a, b) => b.matchPercentage - a.matchPercentage).slice(0, 10);
  }

  // Check stream compatibility
  checkStreamCompatibility(userStream, educationPath) {
    const streamMap = {
      'Science': ['Engineering', 'Medical', 'Research'],
      'Commerce': ['Business', 'Finance', 'Economics'],
      'Arts': ['Humanities', 'Design', 'Social Sciences']
    };

    const compatibleFields = streamMap[userStream] || [];
    
    for (const path of educationPath) {
      for (const field of path.fields) {
        if (compatibleFields.some(cf => field.toLowerCase().includes(cf.toLowerCase()))) {
          return 1;
        }
      }
    }
    return 0.5;
  }

  // Calculate interest match
  calculateInterestMatch(userInterests, careerTitle, careerCategory) {
    let matchScore = 0;

    userInterests.forEach(interest => {
      const interestLower = interest.toLowerCase();
      const titleLower = careerTitle.toLowerCase();
      const categoryLower = careerCategory.toLowerCase();

      if (titleLower.includes(interestLower) || categoryLower.includes(interestLower)) {
        matchScore += 33.33;
      }
    });

    return Math.min(matchScore, 100);
  }

  // Merge AI and database recommendations
  async mergeRecommendations(aiCareers, dbMatches, studentData) {
    const merged = [];
    const seenTitles = new Set();

    // Add top DB matches first
    for (const match of dbMatches.slice(0, 3)) {
      if (!seenTitles.has(match.career.title)) {
        // Find colleges for this career
        const colleges = await this.findCollegesForCareer(
          match.career,
          studentData.location
        );

        merged.push({
          itemId: match.career._id,
          itemType: 'career',
          title: match.career.title,
          matchPercentage: match.matchPercentage,
          category: match.career.category,
          description: match.career.description,
          reasoning: this.generateReasoning(match, studentData),
          educationPath: match.career.educationPath,
          requiredSkills: match.career.requiredSkills.map(s => s.skill),
          salaryRange: match.career.salaryRange,
          growth: match.career.growth,
          collegesInCity: colleges,
          pros: this.generatePros(match.career),
          cons: this.generateCons(match.career),
          actionSteps: this.generateActionSteps(match.career, studentData),
          resources: []
        });

        seenTitles.add(match.career.title);
      }
    }

    // Add AI careers if not already included
    for (const aiCareer of aiCareers) {
      if (!seenTitles.has(aiCareer.title) && merged.length < 5) {
        merged.push({
          itemType: 'career',
          title: aiCareer.title,
          matchPercentage: aiCareer.matchPercentage || 75,
          category: aiCareer.category,
          reasoning: aiCareer.reasoning,
          educationPath: aiCareer.educationPath || [],
          requiredSkills: aiCareer.skills || [],
          salaryRange: aiCareer.salaryRange,
          growth: { demand: aiCareer.demand, futureScope: aiCareer.futureScope },
          collegesInCity: aiCareer.collegesInCity || [],
          actionSteps: aiCareer.roadmap || [],
          pros: [],
          cons: []
        });

        seenTitles.add(aiCareer.title);
      }
    }

    return merged;
  }

  // Find colleges for a specific career in user's city
  async findCollegesForCareer(career, location) {
    const relevantFields = career.educationPath.map(p => p.fields).flat();
    
    const colleges = await College.find({
      'location.city': new RegExp(location.city, 'i'),
      'courses.name': { $in: relevantFields.map(f => new RegExp(f, 'i')) },
      isActive: true
    })
    .select('name shortName type courses ratings placementStats')
    .limit(5)
    .sort({ 'ratings.placement': -1 });

    return colleges.map(c => ({
      name: c.name,
      type: c.type,
      rating: c.ratings.overall,
      placementPercentage: c.placementStats.placementPercentage,
      averagePackage: c.placementStats.averagePackage
    }));
  }

  // Generate reasoning
  generateReasoning(match, studentData) {
    const reasons = [];
    
    if (match.matchPercentage >= 80) {
      reasons.push(`Excellent match (${match.matchPercentage}%) based on your aptitude profile`);
    }

    if (studentData.assessmentScores?.technical >= 70 && 
        match.career.aptitudeMapping?.technical >= 70) {
      reasons.push('Strong technical skills align well with this career');
    }

    if (studentData.stream === 'Science' && 
        match.career.category === 'Engineering') {
      reasons.push('Your Science background is ideal for this field');
    }

    return reasons.join('. ') || 'Good match based on your profile';
  }

  // Generate pros
  generatePros(career) {
    const pros = [];
    
    if (career.growth.demand === 'High') {
      pros.push('High demand in job market');
    }
    
    if (career.salaryRange.entry.max >= 1000000) {
      pros.push('Excellent starting salary potential');
    }
    
    if (career.growth.automationRisk === 'Low') {
      pros.push('Low risk of automation');
    }

    return pros;
  }

  // Generate cons
  generateCons(career) {
    const cons = [];
    
    if (career.growth.demand === 'Low') {
      cons.push('Limited job opportunities');
    }
    
    if (career.growth.automationRisk === 'High') {
      cons.push('High automation risk');
    }

    return cons;
  }

  // Generate action steps
  generateActionSteps(career, studentData) {
    const steps = [];
    
    // Step 1: Education
    if (career.educationPath.length > 0) {
      const path = career.educationPath[0];
      steps.push(`Pursue ${path.level} in ${path.fields.join(' or ')}`);
    }

    // Step 2: Entrance exams
    steps.push('Prepare for relevant entrance exams');

    // Step 3: Skills
    if (career.requiredSkills.length > 0) {
      const topSkills = career.requiredSkills
        .filter(s => s.importance >= 4)
        .map(s => s.skill)
        .slice(0, 3);
      
      if (topSkills.length > 0) {
        steps.push(`Develop skills: ${topSkills.join(', ')}`);
      }
    }

    // Step 4: Internships
    steps.push('Gain practical experience through internships');

    return steps;
  }
}

module.exports = new CareerService
