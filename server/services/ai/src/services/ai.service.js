const { groq, gemini, AI_CONFIG } = require('../config/ai.config');

class AIService {
  // Primary: Groq with structured output
  async callGroq(systemPrompt, userPrompt, options = {}) {
    try {
      const response = await Promise.race([
        groq.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          model: options.model || AI_CONFIG.GROQ.MODEL,
          temperature: options.temperature || AI_CONFIG.GROQ.TEMPERATURE,
          max_tokens: options.maxTokens || AI_CONFIG.GROQ.MAX_TOKENS,
          response_format: { type: "json_object" }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Groq timeout')), AI_CONFIG.GROQ.TIMEOUT)
        )
      ]);

      const content = response.choices[0]?.message?.content;
      return JSON.parse(content);
    } catch (error) {
      console.error('Groq error:', error.message);
      
      if (AI_CONFIG.FALLBACK_ENABLED) {
        console.log('Falling back to Gemini...');
        return this.callGemini(systemPrompt, userPrompt, options);
      }
      
      throw error;
    }
  }

  // Fallback: Google Gemini
  async callGemini(systemPrompt, userPrompt, options = {}) {
    try {
      const model = gemini.getGenerativeModel({ 
        model: options.model || AI_CONFIG.GEMINI.MODEL 
      });
      
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}\n\nRespond ONLY with valid JSON.`;
      
      const result = await model.generateContent(fullPrompt);
      const content = result.response.text();
      
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return JSON.parse(content);
    } catch (error) {
      console.error('Gemini error:', error.message);
      throw new Error('Both AI providers failed');
    }
  }

  // Main analysis method
  async analyze(systemPrompt, userPrompt, options = {}) {
    return this.callGroq(systemPrompt, userPrompt, options);
  }
}

module.exports = new AIService();
