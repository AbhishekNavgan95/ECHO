import express from 'express';
import { getVectorStore } from '../config/database.js';
import { chat } from '../config/openai.js';
import { chatRateLimit } from '../middleware/rateLimiter.js';

const router = express.Router();

// Chat endpoint with dedicated rate limiting
router.post('/', chatRateLimit, async (req, res) => {
  try {
    const { question } = req.body || {};
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ ok: false, error: 'question (string) is required' });
    }

    const datasetId = String(req.query.datasetId || 'default');
    const namespace = datasetId;
    const store = await getVectorStore(namespace);

    const topK = Number(req.query.k || 6);
    const docs = await store.similaritySearch(question, topK);

    if (!docs || docs.length === 0) {
      const info = req.rateLimit || {};
      return res.json({
        ok: true,
        answer: "I couldn't find anything in your data to answer that.",
        chatLimit: {
          used: info.limit ? info.limit - info.remaining : 0,
          remaining: info.remaining ?? 20,
          total: info.limit ?? 20,
          resetTime: info.resetTime ? new Date(info.resetTime).toISOString() : null,
        }
      });
    }

    const context = docs.map((d, i) => {
      const meta = d.metadata ? JSON.stringify(d.metadata) : '{}';
      return `#${i + 1}\n${d.pageContent}\nMETA:${meta}`;
    }).join('\n\n');

    console.log("context : ", context);

    const SYSTEM = `
      You are a concise RAG assistant. 
      Use only the provided context snippets to answer. If the answer is not in the context, say you don't know.
      
      Rule: 
      - Never exceed the context data given below, don't use general information which you already have strictly stay in the limit of the context data given below.
      - If the answer is not present in the context just reply with something like 'I do not have any idea about that topic, you can insert data in my knowledge base through the left side (knowledge base) panel'.
      - Answer in Hindi (chill + respectful vibe) only if the user question is in Hindi. Otherwise answer in English.
      - Always return the reference of data where you got the answer from. 
        Example - 
        query - which are best projects of abhishek navgan?
        response - Abhishek Navgan's best projects include:
                    1. **Devnest**: An AI-powered full-stack LMS developed using React.js, Node.js, and MongoDB, which increased student engagement by 45% and integrated features like chunked video streaming and a real-time code editor.
                    2. **QuizByte**: An exam platform built with Next.js, TypeScript, and MongoDB, supporting over 1,000 users and featuring a cheating-prevented exam system with dynamic questions.
                    These projects showcase his skills in full-stack development and user engagement enhancements.
                    reference: the projects data is given in the projects section of the resume.

       - Context: ${context}
    `;

    const response = await chat.invoke([
      { role: 'system', content: SYSTEM },
      { role: 'user', content: question },
    ]);

    // Get chat-specific rate limit info
    const info = req.rateLimit || {};

    res.json({
      ok: true,
      answer: response.content,
      chatLimit: {
        used: info.limit ? info.limit - info.remaining : 0,
        remaining: info.remaining ?? 20,
        total: info.limit ?? 20,
        resetTime: info.resetTime ? new Date(info.resetTime).toISOString() : null,
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
