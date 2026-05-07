import { GoogleGenAI } from '@google/genai';

if (!process.env.AI_API_KEY) {
  throw new Error('AI_API_KEY não definida no .env');
}

export const gemini = new GoogleGenAI({
  apiKey: process.env.AI_API_KEY,
});

// export const GEMINI_MODEL = 'gemini-2.5-flash';
// export const GEMINI_MODEL = 'gemini-2.5-pro';
export const GEMINI_MODEL = 'gemini-2.0-flash';
