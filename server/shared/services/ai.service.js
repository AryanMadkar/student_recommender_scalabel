const { groq, gemini, AI_CONFIG, PROMPT_TEMPLATES } = require('../config/ai');
const logger = require('../utils/logger');

class AIService {
  // Generate personalized recommendations using Groq with fallback
  async generatePersonalizedRecommendations(user) {
    const prompt = this.buildRecommendationPrompt(user);
    
    // Try Groq first
    try {
      logger.info('Attempting Groq AI recommendation generation');
      
      const response = await Promise.race([
        groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are an expert career counselor specializing in Indian education system. Provide detailed, practical recommendations based on student data. Respond in JSON format."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          model: AI_CONFIG.GROQ.MODEL,
          temperature: AI_CONFIG.GROQ.TEMPERATURE,
          max_tokens: AI_CONFIG.GROQ.MAX_TOKENS
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Groq API timeout')), AI_CONFIG.GROQ.TIMEOUT)
        )
      ]);
      
      const result = this.parseAIRecommendations(response.choices[0].message.content);
      logger.info('Groq AI recommendation generation successful');
      return result;
      
    } catch (groqError) {
      logger.warn('Groq AI failed, trying Gemini fallback:', groqError.message);
      
      // Fallback to Gemini
      try {
        const model = gemini.getGenerativeModel({ model: AI_CONFIG.GEMINI.MODEL });
        
        const result = await Promise.race([
          model.generateContent(prompt),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Gemini API timeout')), AI_CONFIG.GEMINI.TIMEOUT)
          )
        ]);
        
        const recommendations = this.parseAIRecommendations(result.response.text());
        logger.info('Gemini AI recommendation generation successful');
        return recommendations;
        
      } catch (geminiError) {
        logger.error('Both AI providers failed:', { groqError: groqError.message, geminiError: geminiError.message });
        return this.getFallbackRecommendations(user);
      }
    }
  }

  // Generate assessment insights with retry logic
  async generateAssessmentInsights(user, scores) {
    const prompt = PROMPT_TEMPLATES.SKILL_ROADMAP
      .replace('{currentStatus}', JSON.stringify({ stage: user.educationStage, academic: user.academicInfo }))
      .replace('{targetCareer}', 'Based on assessment scores: ' + JSON.stringify(scores));
    
    for (let attempt = 1; attempt <= AI_CONFIG.RETRY_ATTEMPTS; attempt++) {
      try {
        logger.info(`AI insight generation attempt ${attempt}`);
        
        const response = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are an educational psychologist. Analyze assessment data and provide actionable insights in JSON format."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          model: AI_CONFIG.GROQ.MODEL,
          temperature: 0.5,
          max_tokens: 1500
        });
        
        return this.parseInsights(response.choices[0].message.content);
        
      } catch (error) {
        logger.warn(`AI insight generation attempt ${attempt} failed:`, error.message);
        
        if (attempt === AI_CONFIG.RETRY_ATTEMPTS) {
          return this.getFallbackInsights(scores);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // Build comprehensive recommendation prompt
  buildRecommendationPrompt(user) {
    return PROMPT_TEMPLATES.CAREER_RECOMMENDATION
      .replace('{profile}', JSON.stringify({
        stage: user.educationStage,
        academic: user.academicInfo,
        location: user.personalInfo?.state || 'Not specified',
        parentalInfluence: user.parentalInfluence
      }))
      .replace('{assessmentResults}', JSON.stringify(user.assessmentResults?.slice(-3) || []));
  }

  // Enhanced parsing with error handling
  parseAIRecommendations(aiResponse) {
    try {
      // Try to parse as JSON first
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback to text parsing
      return {
        careerPaths: this.extractCareerPaths(aiResponse),
        colleges: this.extractColleges(aiResponse),
        skills: this.extractSkills(aiResponse),
        actionSteps: this.extractActionSteps(aiResponse),
        rawResponse: aiResponse
      };
      
    } catch (error) {
      logger.error('Failed to parse AI response:', error);
      return {
        careerPaths: this.extractCareerPaths(aiResponse),
        colleges: [],
        skills: [],
        actionSteps: [],
        rawResponse: aiResponse,
        parseError: error.message
      };
    }
  }

  // Enhanced text extraction methods
  extractCareerPaths(response) {
    const careerSection = response.match(/(?:career paths?|careers?):?\s*(.*?)(?=(?:college|skill|action|$))/is);
    if (!careerSection) return [];
    
    return careerSection[1]
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .slice(0, 5); // Limit to top 5
  }

  extractColleges(response) {
    const collegeSection = response.match(/(?:college|institution)s?:?\s*(.*?)(?=(?:skill|action|$))/is);
    if (!collegeSection) return [];
    
    return collegeSection[1]
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .slice(0, 5);
  }

  extractSkills(response) {
    const skillsSection = response.match(/skills?:?\s*(.*?)(?=(?:action|$))/is);
    if (!skillsSection) return [];
    
    return skillsSection[1]
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .slice(0, 8);
  }

  extractActionSteps(response) {
    const actionSection = response.match(/(?:action steps?|next steps?|recommendations?):?\s*(.*?)$/is);
    if (!actionSection) return [];
    
    return actionSection[1]
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .slice(0, 6);
  }

  // Enhanced fallback recommendations
  getFallbackRecommendations(user) {
    const stageRecommendations = {
      'after10th': {
        careerPaths: ['Engineering', 'Medical', 'Commerce', 'Arts & Design'],
        colleges: ['Local colleges in your area', 'State universities', 'Private institutions'],
        skills: ['Communication', 'Critical thinking', 'Subject expertise', 'Time management'],
        actionSteps: [
          'Complete 12th grade with good marks',
          'Explore different subjects and interests',
          'Prepare for entrance exams',
          'Research colleges and courses'
        ]
      },
      'after12th': {
        careerPaths: ['Software Engineering', 'Data Science', 'Business Management', 'Healthcare'],
        colleges: ['IITs', 'NITs', 'State Engineering Colleges', 'Private Universities'],
        skills: ['Technical skills', 'Problem solving', 'Leadership', 'Analytical thinking'],
        actionSteps: [
          'Prepare for entrance exams',
          'Apply to multiple colleges',
          'Develop relevant skills',
          'Build a strong foundation'
        ]
      },
      'ongoing': {
        careerPaths: ['Software Developer', 'Product Manager', 'Consultant', 'Entrepreneur'],
        colleges: [],
        skills: ['Programming', 'Project management', 'Communication', 'Industry knowledge'],
        actionSteps: [
          'Complete internships',
          'Build projects portfolio',
          'Network with professionals',
          'Prepare for placements'
        ]
      }
    };
    
    return stageRecommendations[user.educationStage] || stageRecommendations['after12th'];
  }

  parseInsights(aiResponse) {
    return {
      strengths: this.extractStrengths(aiResponse),
      weaknesses: this.extractWeaknesses(aiResponse),
      learningStyle: this.extractLearningStyle(aiResponse),
      improvements: this.extractImprovements(aiResponse),
      motivation: this.extractMotivation(aiResponse),
      rawResponse: aiResponse
    };
  }

  extractStrengths(response) {
    const strengthsMatch = response.match(/strengths?:?\s*(.*?)(?=weaknesses?|learning|$)/is);
    return strengthsMatch ? strengthsMatch[1].split('\n').filter(s => s.trim()).slice(0, 5) : ['Analytical thinking'];
  }

  extractWeaknesses(response) {
    const weaknessMatch = response.match(/weaknesses?:?\s*(.*?)(?=learning|improvement|$)/is);
    return weaknessMatch ? weaknessMatch[1].split('\n').filter(s => s.trim()).slice(0, 5) : ['Time management'];
  }

  extractLearningStyle(response) {
    const styleMatch = response.match(/learning style:?\s*(.*?)(?=improvement|motivation|$)/is);
    return styleMatch ? styleMatch[1].trim() : 'Balanced learner';
  }

  extractImprovements(response) {
    const improvementMatch = response.match(/improvements?:?\s*(.*?)(?=motivation|$)/is);
    return improvementMatch ? improvementMatch[1].split('\n').filter(s => s.trim()).slice(0, 5) : ['Practice regularly'];
  }

  extractMotivation(response) {
    const motivationMatch = response.match(/motivation:?\s*(.*?)$/is);
    return motivationMatch ? motivationMatch[1].trim() : 'Set clear goals and celebrate small wins';
  }

  getFallbackInsights(scores) {
    const topSkill = Object.entries(scores)
      .filter(([key]) => key !== 'overall')
      .sort(([,a], [,b]) => b - a)[0];
    
    return {
      strengths: [topSkill ? `Strong ${topSkill[0]} abilities` : 'Well-rounded capabilities'],
      weaknesses: ['Areas identified for improvement based on assessment'],
      learningStyle: 'Mixed learning approach recommended',
      improvements: ['Regular practice', 'Skill development', 'Consistent effort'],
      motivation: 'Focus on continuous learning and growth'
    };
  }
}

module.exports = new AIService();
