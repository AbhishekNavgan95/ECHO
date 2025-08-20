import express from "express";
import { getVectorStore } from "../config/database.js";
import { chat } from "../config/openai.js";
import { chatRateLimit, getChatLimitSnapshot } from "../middleware/rateLimiter.js";
import { requireAuth } from "../middleware/auth.js";
import { ChatHistory } from "../models/ChatHistory.js";

const router = express.Router();

// Chat endpoint with user-based rate limiting
router.post("/", requireAuth, chatRateLimit, async (req, res) => {
  try {
    const { question } = req.body || {};
    if (!question || typeof question !== "string") {
      return res
        .status(400)
        .json({ ok: false, error: "question (string) is required" });
    }

    // console.log("question : ", question);

    const datasetId = String(req.query.datasetId || "default");
    const userNamespace = `u_${req.user.id}_${datasetId}`;

    // console.log("usernamespace  : ", userNamespace);
    const store = await getVectorStore(userNamespace);
    
    const topK = Number(req.query.k || 6);
    const docs = await store.similaritySearch(question, topK);
    // console.log("docs  : ", docs);

    // Always use SSE to avoid frontend getting stuck expecting a stream
    const info = req.rateLimit || {};
    if (!docs || docs.length === 0) {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      if (typeof res.flushHeaders === 'function') res.flushHeaders();
      res.write(
        `data: ${JSON.stringify({
          type: "start",
          chatLimit: {
            used: info.limit ? info.limit - info.remaining : 0,
            remaining: info.remaining ?? 20,
            total: info.limit ?? 20,
            resetTime: info.resetTime ? new Date(info.resetTime).toISOString() : null,
            resetTimestamp: info.resetTime ? new Date(info.resetTime).getTime() : null,
          },
        })}\n\n`
      );
      res.write(
        `data: ${JSON.stringify({
          type: "end",
          fullContent: "I couldn't find anything in your data to answer that.",
          chatLimit: {
            used: info.limit ? info.limit - info.remaining : 0,
            remaining: info.remaining ?? 20,
            total: info.limit ?? 20,
            resetTime: info.resetTime ? new Date(info.resetTime).toISOString() : null,
            resetTimestamp: info.resetTime ? new Date(info.resetTime).getTime() : null,
          },
        })}\n\n`
      );
      res.end();
      return;
    }

    const context = docs
      .map((d, i) => {
        const meta = d.metadata ? JSON.stringify(d.metadata) : "{}";
        return `#${i + 1}\n${d.pageContent}\nMETA:${meta}`;
      })
      .join("\n\n");

    console.log("context : ", context);

    const SYSTEM = `
    You are a concise RAG assistant.
  
    Rules:
    - Use BOTH the provided context snippets (from knowledge base) AND the prior conversation history to answer the user.
    - If the answer is not present in either the context snippets or history, say:
      "I do not have any idea about that topic, you can insert data in my knowledge base through the left side (knowledge base) panel."
    - If the question is in Hindi, answer in Hindi (respectful + chill vibe). Otherwise answer in English.
    - Always return the reference of data where you got the answer from if it comes from context. If the answer comes from chat history, mention it's from the prior conversation.
  
    Context snippets:
    ${context}`;
  
  

    // Set up Server-Sent Events headers (CORS handled globally)
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    // Send initial data with rate limit info (snapshot based on user id)
    const limitSnapshot = getChatLimitSnapshot(req.user?.id)
    res.write(
      `data: ${JSON.stringify({
        type: "start",
        chatLimit: limitSnapshot,
      })}\n\n`
    );

    // Load prior history for this user + dataset (limit the window to keep token usage low)
    const historyDoc = await ChatHistory.findOne({ user: req.user.id, datasetId });
    const priorMessages = (historyDoc?.messages || []).slice(-20).map(m => ({
      role: m.role,
      content: m.content,
    }));

    console.log("priorMessages : ", priorMessages);

    try {
      const stream = await chat.stream([
        { role: "system", content: SYSTEM },
        ...priorMessages,
        { role: "user", content: question },
      ]);

      let fullContent = "";

      for await (const chunk of stream) {
        if (chunk.content) {
          fullContent += chunk.content;
          res.write(
            `data: ${JSON.stringify({
              type: "chunk",
              content: chunk.content,
            })}\n\n`
          );
        }
      }

      // Send final message with complete content
      const endSnapshot = getChatLimitSnapshot(req.user?.id)
      res.write(
        `data: ${JSON.stringify({
          type: "end",
          fullContent: fullContent,
          chatLimit: endSnapshot,
        })}\n\n`
      );

      // Persist this turn to history
      const toAppend = [
        { role: 'user', content: question },
        { role: 'assistant', content: fullContent },
      ];
      await ChatHistory.updateOne(
        { user: req.user.id, datasetId },
        { $push: { messages: { $each: toAppend } } },
        { upsert: true }
      );
    } catch (streamError) {
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          error: streamError.message,
        })}\n\n`
      );
    }

    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Fetch recent chat history for the authenticated user (optionally per datasetId)
router.get("/history", requireAuth, async (req, res) => {
  try {
    const datasetId = String(req.query.datasetId || "default");
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const historyDoc = await ChatHistory.findOne({ user: req.user.id, datasetId });
    const messages = (historyDoc?.messages || []).slice(-limit);
    res.json({ ok: true, datasetId, messages });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Clear chat history for the authenticated user (optionally per datasetId)
router.delete("/history", requireAuth, async (req, res) => {
  try {
    const datasetId = String(req.query.datasetId || "default");
    await ChatHistory.updateOne(
      { user: req.user.id, datasetId },
      { $set: { messages: [] } },
      { upsert: true }
    );
    res.json({ ok: true, datasetId });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
