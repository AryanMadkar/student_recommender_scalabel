const { ChatGroq } = require('@langchain/groq');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { PromptTemplate } = require('langchain/prompts');
const { LLMChain } = require('langchain/chains');
const { AI_CONFIG } = require('./ai.config');

// Initialize LangChain Groq
const groqChat = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  modelName: AI_CONFIG.GROQ.MODEL,
  temperature: AI_CONFIG.GROQ.TEMPERATURE,
  maxTokens: AI_CONFIG.GROQ.MAX_TOKENS
});

// Initialize LangChain Gemini
const geminiChat = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: AI_CONFIG.GEMINI.MODEL,
  temperature: AI_CONFIG.GEMINI.TEMPERATURE,
  maxOutputTokens: AI_CONFIG.GEMINI.MAX_TOKENS
});

// Create reusable chains
const createChain = (template, llm = groqChat) => {
  const prompt = PromptTemplate.fromTemplate(template);
  return new LLMChain({ llm, prompt });
};

module.exports = {
  groqChat,
  geminiChat,
  createChain
};
