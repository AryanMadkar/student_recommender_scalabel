const College = require('../models/College');
const Course = require('../models/Course');
const Career = require('../models/Career');
const User = require('../models/User');

class RecommendationService {
  // Recommend streams for post-10th students
  async recommendStreams(class10Data, assessmentScores, parentalInfluence) {
    const streamRecommendations = [];
    
    // Science stream recommendation
    const scienceScore = this.calculateStreamScore('science', class10Data, assessmentScores, parentalInfluence);
    if (scienceScore > 60) {
      streamRecommendations.push({
        name: 'Science',
        matchPercentage: Math.round(scienceScore),
        subjects: {
          PCM: 'Physics, Chemistry, Mathematics',
          PCB: 'Physics, Chemistry, Biology'
        },
        careerOptions: ['Engineering', 'Medicine', 'Research', 'Technology'],
        reasoning: this.generateStreamReasoning('science', assessmentScores, class10Data)
      });
    }

    // Commerce stream recommendation
    const commerceScore = this.calculateStreamScore('commerce', class10Data, assessmentScores, parentalInfluence);
    if (commerceScore > 60) {
      streamRecommendations.push({
        name: 'Commerce',
        matchPercentage: Math.round(commerceScore),
        subjects: {
          with_math: 'Accountancy, Business Studies, Economics, Mathematics',
          without_math: 'Accountancy, Business Studies, Economics'
        },
        careerOptions: ['Business', 'Finance', 'CA/CS', 'Management'],
        reasoning: this.generateStreamReasoning('commerce', assessmentScores, class10Data)
      });
    }

    // Arts/Humanities stream recommendation
    const artsScore = this.calculateStreamScore('arts', class10Data, assessmentScores, parentalInfluence);
    if (artsScore > 60) {
      streamRecommendations.push({
        name: 'Arts',
        matchPercentage: Math.round(artsScore),
        subjects: {
          options: 'History, Geography, Political Science, Psychology, Sociology, Literature'
        },
        careerOptions: ['Civil Services', 'Media', 'Teaching', 'Arts', 'Literature'],
        reasoning: this.generateStreamReasoning('arts', assessmentScores, class10Data)
      });
    }

    return streamRecommendations.sort((a, b) => b.matchPercentage - a.matchPercentage);
  }

  // Calculate stream matching score
  calculateStreamScore(stream, class10Data, assessmentScores, parentalInfluence) {
    let score = 0;
    
    // Academic performance factor (30%)
    if (class10Data.subjects) {
      switch (stream) {
        case 'science':
          const scienceMarks = this.getSubjectMarks(class10Data.subjects, ['Math', 'Science']);
          score += (scienceMarks.average / 100) * 30;
          break;
        case 'commerce':
          const commerceMarks = this.getSubjectMarks(class10Data.subjects, ['Math', 'Social Science']);
          score += (commerceMarks.average / 100) * 30;
          break;
        case 'arts':
          const artsMarks = this.getSubjectMarks(class10Data.subjects, ['English', 'Social Science']);
          score += (artsMarks.average / 100) * 30;
          break;
      }
    }
    
    // Aptitude scores factor (50%)
    if (assessmentScores) {
      switch (stream) {
        case 'science':
          score += ((assessmentScores.analytical || 0) * 0.3 + (assessmentScores.technical || 0) * 0.2) * 0.5;
          break;
        case 'commerce':
          score += ((assessmentScores.analytical || 0) * 0.2 + (assessmentScores.leadership || 0) * 0.3) * 0.5;
          break;
        case 'arts':
          score += ((assessmentScores.creative || 0) * 0.3 + (assessmentScores.communication || 0) * 0.2) * 0.5;
          break;
      }
    }
    
    // Parental influence factor (20%)
    if (parentalInfluence && parentalInfluence.preferredFields) {
      const streamKeywords = {
        science: ['engineering', 'medical', 'technology', 'research'],
        commerce: ['business', 'finance', 'management', 'commerce'],
        arts: ['arts', 'literature', 'humanities', 'social']
      };
      
      const matches = parentalInfluence.preferredFields.filter(field => 
        streamKeywords[stream].some(keyword => 
          field.toLowerCase().includes(keyword)
        )
      );
      
      score += (matches.length / parentalInfluence.preferredFields.length) * 20;
    }
    
    return Math.min(score, 100);
  }

  // Get colleges for specific stream
  async getCollegesForStream(streamName, userLocation) {
    const query = {
      isActive: true,
      'courses.eligibility.stream': { $in: [streamName] }
    };
    
    if (userLocation && userLocation.state) {
      query['location.state'] = userLocation.state;
    }

    const colleges = await College.find(query)
      .sort({ 'ratings.overall': -1 })
      .limit(20);

    return colleges.map(college => ({
      id: college._id,
      name: college.name,
      location: college.location,
      ratings: college.ratings,
      courses: college.courses.filter(course => 
        course.eligibility.stream.includes(streamName)
      ),
      fees: college.courses.length > 0 ? college.courses[0].fees : null
    }));
  }

  // Recommend courses for post-12th students
  async recommendCourses(stream, class12Data, assessmentScores) {
    const courses = await Course.find({ 
      category: this.getCourseCategoryFromStream(stream),
      type: 'Bachelor'
    });

    const recommendations = courses.map(course => ({
      ...course.toObject(),
      matchScore: this.calculateCourseMatchScore(course, stream, class12Data, assessmentScores),
      reasoning: this.generateCourseReasoning(course, assessmentScores)
    }));

    return recommendations
      .filter(rec => rec.matchScore > 60)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);
  }

  // Get course category from stream
  getCourseCategoryFromStream(stream) {
    const mapping = {
      'Science': 'Engineering',
      'Commerce': 'Commerce',
      'Arts': 'Arts'
    };
    return mapping[stream] || 'Engineering';
  }

  // Calculate course match score
  calculateCourseMatchScore(course, stream, class12Data, assessmentScores) {
    let score = 0;
    
    // Stream compatibility (40%)
    if (course.eligibility.requiredSubjects) {
      const hasRequiredSubjects = course.eligibility.requiredSubjects.every(subject =>
        class12Data.subjects.some(s => s.name.toLowerCase().includes(subject.toLowerCase()))
      );
      if (hasRequiredSubjects) score += 40;
    }
    
    // Academic performance (30%)
    if (class12Data.percentage >= course.eligibility.minimumMarks) {
      score += 30;
    } else {
      score += (class12Data.percentage / course.eligibility.minimumMarks) * 30;
    }
    
    // Aptitude alignment (30%)
    if (assessmentScores && course.skills) {
      const skillMatch = this.calculateSkillMatch(assessmentScores, course.skills);
      score += skillMatch * 0.3;
    }
    
    return Math.min(score, 100);
  }

  // Get college recommendations with cutoff analysis
  async getCollegeRecommendations(courseRecommendations, userPercentage, userLocation) {
    const recommendations = [];
    
    for (const course of courseRecommendations.slice(0, 5)) {
      const colleges = await College.find({
        'courses.name': new RegExp(course.name, 'i'),
        isActive: true
      });
      
      const collegeRecs = colleges.map(college => {
        const relevantCourse = college.courses.find(c => 
          c.name.toLowerCase().includes(course.name.toLowerCase())
        );
        
        if (!relevantCourse) return null;
        
        const cutoffAnalysis = this.analyzeCutoffs(relevantCourse.cutoffs, userPercentage);
        
        return {
          college,
          course: relevantCourse,
          cutoffAnalysis,
          matchScore: this.calculateCollegeMatchScore(college, userLocation, cutoffAnalysis),
          affordability: this.calculateAffordability(relevantCourse.fees)
        };
      }).filter(Boolean);
      
      recommendations.push({
        courseName: course.name,
        colleges: collegeRecs.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5)
      });
    }
    
    return recommendations;
  }

  // Analyze cutoffs for admission chances
  analyzeCutoffs(cutoffs, userPercentage) {
    if (!cutoffs || cutoffs.length === 0) {
      return { chance: 'Unknown', message: 'Cutoff data not available' };
    }
    
    const latestCutoff = cutoffs.reduce((latest, current) => 
      current.year > latest.year ? current : latest
    );
    
    const percentageDiff = userPercentage - latestCutoff.cutoff;
    
    if (percentageDiff >= 5) {
      return { chance: 'High', message: 'Strong chance of admission', color: 'green' };
    } else if (percentageDiff >= 0) {
      return { chance: 'Good', message: 'Good chance of admission', color: 'orange' };
    } else if (percentageDiff >= -5) {
      return { chance: 'Low', message: 'Challenging but possible', color: 'red' };
    } else {
      return { chance: 'Very Low', message: 'Consider as backup option', color: 'gray' };
    }
  }

  // Get entrance exam guidance
  async getEntranceExamGuidance(courseRecommendations) {
    const examGuidance = {};
    
    courseRecommendations.forEach(course => {
      if (course.eligibility.entranceExams) {
        course.eligibility.entranceExams.forEach(exam => {
          if (!examGuidance[exam]) {
            examGuidance[exam] = {
              name: exam,
              courses: [],
              description: this.getExamDescription(exam),
              preparationTips: this.getExamPreparationTips(exam),
              timeline: this.getExamTimeline(exam)
            };
          }
          examGuidance[exam].courses.push(course.name);
        });
      }
    });
    
    return Object.values(examGuidance);
  }

  // Generate skill development roadmap
  async generateSkillRoadmap(currentCourse, assessmentScores) {
    const roadmap = {
      immediate: [], // 0-3 months
      short: [],    // 3-6 months
      medium: [],   // 6-12 months
      long: []      // 12+ months
    };
    
    // Get skills required for current course
    const course = await Course.findOne({
      name: new RegExp(currentCourse.degree, 'i')
    });
    
    if (course && course.skills) {
      // Technical skills roadmap
      course.skills.technical.forEach(skill => {
        const currentLevel = this.getSkillLevel(skill, assessmentScores);
        const roadmapEntry = {
          skill,
          currentLevel,
          targetLevel: 'Advanced',
          resources: this.getSkillResources(skill),
          timeline: this.getSkillTimeline(skill, currentLevel)
        };
        
        // Assign to appropriate timeline
        if (currentLevel === 'Beginner') {
          roadmap.immediate.push(roadmapEntry);
        } else if (currentLevel === 'Intermediate') {
          roadmap.short.push(roadmapEntry);
        }
      });
      
      // Soft skills roadmap
      course.skills.soft.forEach(skill => {
        const roadmapEntry = {
          skill,
          importance: 'High',
          resources: this.getSoftSkillResources(skill),
          activities: this.getSoftSkillActivities(skill)
        };
        roadmap.medium.push(roadmapEntry);
      });
    }
    
    // Industry-specific skills
    const industrySkills = this.getIndustrySpecificSkills(currentCourse.specialization);
    industrySkills.forEach(skill => {
      roadmap.long.push({
        skill,
        type: 'Industry Specific',
        importance: 'High',
        resources: this.getSkillResources(skill)
      });
    });
    
    return roadmap;
  }

  // Get internship recommendations
  async getInternshipRecommendations(currentCourse, userLocation) {
    // This would typically integrate with internship APIs or databases
    const recommendations = [
      {
        type: 'Technical',
        companies: this.getTechnicalInternshipCompanies(currentCourse),
        skills: ['Programming', 'Problem Solving', 'Project Work'],
        duration: '2-6 months',
        stipend: 'Rs. 10,000 - 50,000/month'
      },
      {
        type: 'Research',
        organizations: this.getResearchInternshipOrgs(currentCourse),
        skills: ['Research', 'Analysis', 'Documentation'],
        duration: '3-6 months',
        stipend: 'Rs. 5,000 - 25,000/month'
      }
    ];
    
    return recommendations;
  }

  // Get placement preparation guidance
  async getPlacementPreparation(currentCourse) {
    const preparation = {
      resume: {
        tips: [
          'Highlight projects and achievements',
          'Include relevant coursework',
          'Showcase technical skills',
          'Add internship experience'
        ],
        template: 'Standard technical resume template'
      },
      
      technicalPrep: {
        topics: this.getTechnicalTopics(currentCourse),
        resources: this.getTechnicalResources(currentCourse),
        practiceplatforms: ['HackerRank', 'LeetCode', 'GeeksforGeeks']
      },
      
      softSkills: {
        areas: ['Communication', 'Leadership', 'Teamwork', 'Problem Solving'],
        preparation: this.getSoftSkillPreparation()
      },
      
      companies: {
        target: this.getTargetCompanies(currentCourse),
        preparation: this.getCompanySpecificPrep(currentCourse)
      }
    };
    
    return preparation;
  }

  // Utility helper methods
  getSubjectMarks(subjects, targetSubjects) {
    const relevantSubjects = subjects.filter(subject => 
      targetSubjects.some(target => 
        subject.name.toLowerCase().includes(target.toLowerCase())
      )
    );
    
    if (relevantSubjects.length === 0) return { average: 0, subjects: [] };
    
    const total = relevantSubjects.reduce((sum, subject) => sum + subject.marks, 0);
    return {
      average: total / relevantSubjects.length,
      subjects: relevantSubjects
    };
  }

  generateStreamReasoning(stream, assessmentScores, class10Data) {
    const reasons = [];
    
    switch (stream) {
      case 'science':
        if (assessmentScores.analytical > 75) reasons.push('Strong analytical abilities');
        if (assessmentScores.technical > 70) reasons.push('Good technical aptitude');
        break;
      case 'commerce':
        if (assessmentScores.leadership > 70) reasons.push('Leadership potential');
        if (assessmentScores.analytical > 65) reasons.push('Analytical thinking skills');
        break;
      case 'arts':
        if (assessmentScores.creative > 70) reasons.push('Creative thinking abilities');
        if (assessmentScores.communication > 75) reasons.push('Excellent communication skills');
        break;
    }
    
    return reasons;
  }

  calculateSkillMatch(assessmentScores, courseSkills) {
    // Simplified skill matching algorithm
    let matchScore = 0;
    const totalSkills = courseSkills.technical.length + courseSkills.soft.length;
    
    // This is a simplified version - in reality, you'd have more sophisticated matching
    if (assessmentScores.technical > 70 && courseSkills.technical.length > 0) {
      matchScore += 30;
    }
    if (assessmentScores.communication > 70 && courseSkills.soft.includes('Communication')) {
      matchScore += 20;
    }
    
    return Math.min(matchScore, 100);
  }

  calculateCollegeMatchScore(college, userLocation, cutoffAnalysis) {
    let score = 0;
    
    // Rating factor (40%)
    score += college.ratings.overall * 8;
    
    // Location preference (30%)
    if (userLocation && college.location.state === userLocation.state) {
      score += 30;
    } else if (userLocation && college.location.city === userLocation.city) {
      score += 20;
    }
    
    // Admission chances (30%)
    const chanceScores = { 'High': 30, 'Good': 20, 'Low': 10, 'Very Low': 5 };
    score += chanceScores[cutoffAnalysis.chance] || 0;
    
    return Math.min(score, 100);
  }

  calculateAffordability(fees) {
    // This is simplified - in reality, you'd consider user's financial background
    if (fees.annual < 50000) return 'Very Affordable';
    if (fees.annual < 100000) return 'Affordable';
    if (fees.annual < 200000) return 'Moderate';
    return 'Expensive';
  }

  // Additional helper methods would go here...
  getExamDescription(exam) {
    const descriptions = {
      'JEE Main': 'Joint Entrance Examination for engineering admissions',
      'JEE Advanced': 'Advanced level exam for IIT admissions',
      'NEET': 'National Eligibility cum Entrance Test for medical courses'
    };
    return descriptions[exam] || 'Entrance examination';
  }

  getExamPreparationTips(exam) {
    // Return exam-specific preparation tips
    return [`Focus on ${exam} syllabus`, 'Practice previous years papers', 'Take mock tests'];
  }

  getExamTimeline(exam) {
    // Return exam-specific timeline
    return 'Check official website for current dates';
  }

  getSkillLevel(skill, assessmentScores) {
    // Determine current skill level based on assessment
    if (assessmentScores.technical > 80) return 'Advanced';
    if (assessmentScores.technical > 60) return 'Intermediate';
    return 'Beginner';
  }

  getSkillResources(skill) {
    // Return resources for learning specific skill
    return [`${skill} online course`, `${skill} tutorial videos`, `${skill} practice platform`];
  }

  getSkillTimeline(skill, currentLevel) {
    const timelines = {
      'Beginner': '3-6 months',
      'Intermediate': '2-4 months',
      'Advanced': '1-2 months'
    };
    return timelines[currentLevel] || '3-6 months';
  }

  getSoftSkillResources(skill) {
    return [`${skill} workshops`, `${skill} books`, `${skill} practice groups`];
  }

  getSoftSkillActivities(skill) {
    return [`Join ${skill} related clubs`, `Practice ${skill} daily`, `Seek feedback on ${skill}`];
  }

  getIndustrySpecificSkills(specialization) {
    const industrySkills = {
      'Computer Science': ['Machine Learning', 'Cloud Computing', 'DevOps'],
      'Mechanical Engineering': ['CAD Design', 'Manufacturing', 'Automation'],
      'Business': ['Digital Marketing', 'Financial Analysis', 'Strategy']
    };
    return industrySkills[specialization] || ['Industry Knowledge', 'Domain Expertise'];
  }

  getTechnicalInternshipCompanies(course) {
    return ['Tech Startups', 'IT Companies', 'Product Companies', 'Service Companies'];
  }

  getResearchInternshipOrgs(course) {
    return ['Universities', 'Research Institutes', 'R&D Labs', 'Think Tanks'];
  }

  getTechnicalTopics(course) {
    const topics = {
      'Computer Science': ['Data Structures', 'Algorithms', 'System Design', 'Databases'],
      'Mechanical': ['Thermodynamics', 'Fluid Mechanics', 'Materials', 'Manufacturing']
    };
    return topics[course.degree] || ['Core Subjects', 'Applied Concepts'];
  }

  getTechnicalResources(course) {
    return ['Online Courses', 'Books', 'Practice Platforms', 'Video Tutorials'];
  }

  getSoftSkillPreparation() {
    return {
      'Communication': ['Practice presentations', 'Join speaking clubs'],
      'Leadership': ['Lead projects', 'Volunteer for leadership roles'],
      'Teamwork': ['Participate in group projects', 'Collaborate effectively']
    };
  }

  getTargetCompanies(course) {
    const companies = {
      'Computer Science': ['Google', 'Microsoft', 'Amazon', 'Flipkart', 'TCS', 'Infosys'],
      'Mechanical': ['Tata Motors', 'Mahindra', 'L&T', 'Bajaj Auto'],
      'Business': ['McKinsey', 'BCG', 'Deloitte', 'KPMG']
    };
    return companies[course.degree] || ['Top Companies in Field'];
  }

  getCompanySpecificPrep(course) {
    return {
      preparation: 'Research company background, values, and recent developments',
      interviewTypes: ['Technical Round', 'HR Round', 'Group Discussion'],
      commonQuestions: ['Tell about yourself', 'Why this company?', 'Technical questions']
    };
  }
}

module.exports = new RecommendationService();
