const { groqChat, geminiChat, createChain } = require('../config/langchain.config');
const { AI_CONFIG } = require('../config/ai.config');

class LangChainService {
  // Stream recommendation with LangChain
  async getStreamRecommendation(studentData) {
    const template = `You are an expert career counselor for Indian students after Class 10.

Student Profile:
- Class 10 Percentage: {percentage}%
- Subject Marks: {subjectMarks}
- Interests: {interests}
- Location: {city}, {state}

Recommend the best stream (Science PCM/PCB, Commerce, or Arts) for Class 11-12 with detailed reasoning.

Respond in JSON format with:
- recommendedStreams (array with stream, matchScore, reasoning, careers, colleges)
- strengths (array)
- actionPlan (array)`;

    try {
      const chain = createChain(template, groqChat);
      
      const result = await chain.call({
        percentage: studentData.percentage,
        subjectMarks: JSON.stringify(studentData.subjectMarks),
        interests: studentData.interests.join(', '),
        city: studentData.city,
        state: studentData.state
      });

      return JSON.parse(result.text);
    } catch (error) {
      console.error('Groq LangChain error:', error.message);
      
      if (AI_CONFIG.FALLBACK_ENABLED) {
        const chain = createChain(template, geminiChat);
        const result = await chain.call(studentData);
        return JSON.parse(result.text);
      }
      
      throw error;
    }
  }

  // Career recommendation
  async getCareerRecommendation(studentData) {
    const template = `Career counselor for Indian Class 12 students.

Profile:
- Stream: {stream}
- Percentage: {percentage}%
- Assessment Scores: Analytical {analytical}, Creative {creative}, Technical {technical}
- Location: {city}

Recommend top 5 careers with match percentage, education path, colleges in {city}, skills needed, salary ranges, and future scope.

JSON format required.`;

    const chain = createChain(template, groqChat);
    
    try {
      const result = await chain.call(studentData);
      return JSON.parse(result.text);
    } catch (error) {
      // Fallback to Gemini
      const fallbackChain = createChain(template, geminiChat);
      const result = await fallbackChain.call(studentData);
      return JSON.parse(result.text);
    }
  }

  // College recommendation based on location
  async getCollegeRecommendation(studentData) {
    const template = `Find best colleges for {course} in {city}, {state} and nearby cities.

Student: Stream {stream}, Percentage {percentage}%, Budget ₹{minBudget}-{maxBudget}

Prioritize:
1. Colleges in {city}
2. Government colleges
3. Within budget
4. Good placements

Return JSON with ranked colleges, fees, cutoffs, placements.`;

    const chain = createChain(template, groqChat);
    const result = await chain.call(studentData);
    return JSON.parse(result.text);
  }
}

module.exports = new LangChainService();
