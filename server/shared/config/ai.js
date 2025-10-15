const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Groq configuration
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Google Gemini configuration
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// AI service configuration
const AI_CONFIG = {
  GROQ: {
    MODEL: 'llama-3.1-8b-instant', // or 'mixtral-8x7b-32768', 'gemma-7b-it'
    MAX_TOKENS: 2000,
    TEMPERATURE: 0.7,
    TIMEOUT: 30000
  },
  GEMINI: {
    MODEL: 'gemini-pro',
    TIMEOUT: 30000
  },
  FALLBACK_ENABLED: true,
  CACHE_DURATION: 3600, // 1 hour
  RETRY_ATTEMPTS: 3
};

// Prompt templates
const PROMPT_TEMPLATES = {
  CAREER_RECOMMENDATION: `
    You are an expert career counselor specializing in the Indian education system.
    
    Student Profile:
    {profile}
    
    Assessment Results:
    {assessmentResults}
    
    Provide detailed career recommendations including:
    1. Top 3 career paths with match percentages
    2. Reasoning for each recommendation
    3. Required skills and qualifications
    4. Potential challenges and how to overcome them
    5. Expected career progression and salary ranges
    
    Format your response as structured JSON.
  `,

  COLLEGE_RECOMMENDATION: `
    You are an expert education advisor for Indian students.
    
    Student Details:
    {studentDetails}
    
    Preferences:
    {preferences}
    
    Provide college recommendations including:
    1. Top colleges matching student profile
    2. Admission probability analysis
    3. Course-specific recommendations
    4. Location and fee considerations
    5. Scholarship opportunities
    
    Format as structured JSON with confidence scores.
  `,

  SKILL_ROADMAP: `
    Create a comprehensive skill development roadmap for:
    
    Current Status:
    {currentStatus}
    
    Target Career:
    {targetCareer}
    
    Include:
    1. Short-term goals (3-6 months)
    2. Medium-term goals (6-12 months)
    3. Long-term goals (1-2 years)
    4. Specific resources and courses
    5. Milestone checkpoints
    6. Industry certifications to pursue
    
    Make it actionable with specific timelines and resources.
  `
};

module.exports = {
  groq,
  gemini,
  AI_CONFIG,
  PROMPT_TEMPLATES
};
