const College = require('../models/College');
const Course = require('../models/Course');
const aiService = require('./ai.service');
const AFTER_12TH_PROMPTS = require('../prompts/after12th.prompts');

class CollegeService {
  // Get college recommendations based on location
  async getCollegeRecommendations(userId, studentData) {
    try {
      // Find colleges in user's city
      const localColleges = await this.findLocalColleges(studentData);

      // Get AI recommendations
      const systemPrompt = "You are an expert on Indian colleges and universities. Provide accurate, practical guidance in JSON format.";
      
      const userPrompt = AFTER_12TH_PROMPTS.COLLEGE_RECOMMENDATION
        .replace('{course}', studentData.course || studentData.stream)
        .replace('{city}', studentData.location.city)
        .replace('{state}', studentData.location.state)
        .replace('{stream}', studentData.stream)
        .replace('{percentage}', studentData.percentage)
        .replace('{minBudget}', studentData.budget?.min || 50000)
        .replace('{maxBudget}', studentData.budget?.max || 500000)
        .replace('{examScores}', JSON.stringify(studentData.examScores || {}));

      const aiResponse = await aiService.analyze(systemPrompt, userPrompt);

      // Combine database results with AI insights
      const recommendations = this.combineCollegeData(localColleges, aiResponse);

      return {
        colleges: recommendations,
        totalCollegesInCity: localColleges.length,
        nearbyOptions: await this.findNearbyColleges(studentData),
        insights: aiResponse.insights || {}
      };
    } catch (error) {
      console.error('College recommendation error:', error);
      throw error;
    }
  }

  // Find colleges in user's city
  async findLocalColleges(studentData) {
    const query = {
      'location.city': new RegExp(studentData.location.city, 'i'),
      isActive: true
    };

    // Filter by stream
    if (studentData.stream) {
      query['courses.eligibility.stream'] = studentData.stream;
    }

    // Filter by budget
    if (studentData.budget) {
      query['courses.fees.annual'] = {
        $gte: studentData.budget.min || 0,
        $lte: studentData.budget.max || 10000000
      };
    }

    const colleges = await College.find(query)
      .select('name shortName type location courses ratings placementStats website')
      .sort({ 'ratings.overall': -1 })
      .limit(20)
      .lean();

    // Calculate match scores
    return colleges.map(college => ({
      ...college,
      matchScore: this.calculateCollegeMatchScore(college, studentData),
      eligibilityStatus: this.checkEligibility(college, studentData)
    })).sort((a, b) => b.matchScore - a.matchScore);
  }

  // Find colleges in nearby cities (within state)
  async findNearbyColleges(studentData) {
    const colleges = await College.find({
      'location.state': new RegExp(studentData.location.state, 'i'),
      'location.city': { $ne: new RegExp(studentData.location.city, 'i') },
      'courses.eligibility.stream': studentData.stream,
      isActive: true
    })
    .select('name location type ratings')
    .limit(10)
    .sort({ 'ratings.overall': -1 })
    .lean();

    return colleges;
  }

  // Calculate college match score
  calculateCollegeMatchScore(college, studentData) {
    let score = 0;

    // Rating weight (40%)
    score += (college.ratings.overall / 5) * 40;

    // Type preference (Government = higher score) (20%)
    if (college.type === 'Government' || college.type === 'Central') {
      score += 20;
    } else if (college.type === 'Deemed') {
      score += 15;
    } else {
      score += 10;
    }

    // Placement (20%)
    if (college.placementStats?.placementPercentage) {
      score += (college.placementStats.placementPercentage / 100) * 20;
    }

    // Fee affordability (20%)
    const relevantCourses = college.courses.filter(c => 
      c.eligibility.stream.includes(studentData.stream)
    );

    if (relevantCourses.length > 0) {
      const avgFee = relevantCourses.reduce((sum, c) => 
        sum + (c.fees.annual || 0), 0
      ) / relevantCourses.length;

      if (studentData.budget) {
        if (avgFee <= studentData.budget.max && avgFee >= studentData.budget.min) {
          score += 20;
        } else if (avgFee <= studentData.budget.max * 1.2) {
          score += 10;
        }
      } else {
        score += 15;
      }
    }

    return Math.round(score);
  }

  // Check eligibility
  checkEligibility(college, studentData) {
    const relevantCourses = college.courses.filter(c => 
      c.eligibility.stream.includes(studentData.stream)
    );

    if (relevantCourses.length === 0) {
      return 'Not Eligible - Stream Mismatch';
    }

    const eligible = relevantCourses.some(course => {
      if (course.eligibility.minimumPercentage) {
        return studentData.percentage >= course.eligibility.minimumPercentage;
      }
      return true;
    });

    if (eligible) {
      return 'Eligible';
    } else {
      return 'Below Cutoff';
    }
  }

  // Combine database and AI data
  combineCollegeData(dbColleges, aiResponse) {
    const combined = [];

    dbColleges.forEach(college => {
      combined.push({
        id: college._id,
        name: college.name,
        type: college.type,
        location: college.location,
        ratings: college.ratings,
        placementStats: college.placementStats,
        matchScore: college.matchScore,
        eligibilityStatus: college.eligibilityStatus,
        courses: college.courses,
        website: college.website
      });
    });

    return combined;
  }

  // Search colleges with advanced filters
  async searchColleges(filters) {
    const query = { isActive: true };

    if (filters.city) {
      query['location.city'] = new RegExp(filters.city, 'i');
    }

    if (filters.state) {
      query['location.state'] = new RegExp(filters.state, 'i');
    }

    if (filters.stream) {
      query['courses.eligibility.stream'] = filters.stream;
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.minRating) {
      query['ratings.overall'] = { $gte: parseFloat(filters.minRating) };
    }

    if (filters.maxFees) {
      query['courses.fees.annual'] = { $lte: parseInt(filters.maxFees) };
    }

    const colleges = await College.find(query)
      .select('name shortName type location courses ratings placementStats')
      .sort({ 'ratings.overall': -1 })
      .limit(filters.limit || 20)
      .skip(filters.skip || 0);

    const total = await College.countDocuments(query);

    return { colleges, total };
  }
}

module.exports = new CollegeService();
