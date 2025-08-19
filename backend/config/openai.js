import { ChatOpenAI } from '@langchain/openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required');

const chat = new ChatOpenAI({
  apiKey: OPENAI_API_KEY,
  model: 'gpt-4o-mini',
  temperature: 0.2,
});

export { chat };
