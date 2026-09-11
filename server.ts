import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in the environment.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Helper to detect transient 503 / high demand / rate limit errors
function isTransientGeminiError(err: any): boolean {
  if (!err) return false;
  const status = err?.status || err?.code || (err?.response && err?.response?.status);
  if (status === 503 || status === 'UNAVAILABLE' || status === 429) return true;

  const msg = typeof err?.message === 'string' ? err.message : JSON.stringify(err);
  return (
    msg.includes('503') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('high demand') ||
    msg.includes('temporarily') ||
    msg.includes('overloaded') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('Resource has been exhausted') ||
    msg.includes('Rate limit')
  );
}

const SUPPORTED_SERVER_MODELS = ['gemini-3.8-flash', 'gemini-flash-latest'] as const;

function validateServerModel(model?: string): string {
  if (model && (SUPPORTED_SERVER_MODELS as readonly string[]).includes(model)) {
    return model;
  }
  return 'gemini-3.8-flash';
}

async function callGeminiWithBackoff(
  ai: GoogleGenAI,
  formattedContents: any[],
  systemInstruction: string,
  requestedModel?: string
): Promise<string> {
  // Use supported models from Google AI Studio Build Mode
  // Primary: validated model (default 'gemini-3.8-flash')
  // Fallback: 'gemini-flash-latest' (supported alias in SKILL.md)
  const primaryModel = validateServerModel(requestedModel);
  const modelsToTry = [primaryModel, primaryModel, 'gemini-flash-latest'];
  let lastError: any = null;

  for (let attempt = 0; attempt < modelsToTry.length; attempt++) {
    const selectedModel = modelsToTry[attempt];
    try {
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: formattedContents,
        config: {
          systemInstruction,
        },
      });

      const replyText = response.text;
      if (replyText) {
        return replyText;
      }
    } catch (err: any) {
      lastError = err;
      const isTransient = isTransientGeminiError(err);
      console.warn(`[Gemini API] Attempt ${attempt + 1} (${selectedModel}) failed:`, err?.message || err);

      if (isTransient && attempt < modelsToTry.length - 1) {
        // Controlled exponential backoff: ~800ms, ~1600ms + random jitter
        const baseDelay = 800 * Math.pow(2, attempt);
        const jitter = Math.floor(Math.random() * 300);
        const delay = baseDelay + jitter;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // If not transient, do not retry further
      if (!isTransient) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Gemini is temporarily busy. Please try again in a moment.');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Gemini CRM Chatbot Endpoint
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { message, history, crmContext, model } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'A text message is required.' });
      }

      const ai = getGeminiClient();

      const systemInstruction = `You are Vidzyra CRM AI, an intelligent, open-ended operational assistant for the Vidzyra Video Editing Agency CRM.
You have direct, real-time access to the agency's CURRENT CRM database and records provided below.

CRITICAL INSTRUCTIONS:
1. ZERO predefined or hardcoded Q&A: You must dynamically understand whatever question the Admin types and answer strictly based on the real-time CRM DATA CONTEXT below.
2. The Admin can ask about ANY CRM topic:
   - Clients (billing, projects, packages, contact info, status, pending balances)
   - Editors (assigned projects, payouts, status, rates, availability)
   - Projects / Work (status, deadlines, revisions, assigned editors, Drive folders, deliverables)
   - Payments (client collections, pending dues, invoices, editor payouts, expenses)
   - Financial Pulse (total revenue, net profit, expenses, margins)
   - Deadlines & Calendar (overdue work, tasks due today or tomorrow, milestones)
   - Revisions (projects in revision, client feedback notes, revision counts)
   - Activities & Notifications (recent team actions, unread alerts)
   - Or any other factual metric or detail in the CRM.
3. Natural Language & Multilingual Understanding:
   The Admin may write in English, Hindi, or Hinglish (e.g., "Is client ke liye payment reminder message bana do", "Kaunse projects overdue hain?", "Total pending revenue kitna hai?").
   Understand their request dynamically and respond in the matching tone and language.
4. Dynamic Message Generation:
   When the Admin asks to draft or generate a message (such as a payment reminder, revision request, delivery note, or greeting):
   - Dynamically identify the relevant client or editor from the query or recent conversation history.
   - Look up their ACTUAL details (e.g. client name, pending balance, project titles, due dates).
   - Generate a customized, ready-to-send message using their real CRM information.
   - Do NOT use fixed or generic message templates.
5. Mathematical Accuracy:
   Perform calculations (sums, differences, profit calculations) accurately based on the real records.
6. Open-ended & Conversational:
   Provide clear, structured, and helpful answers using clean Markdown (bold text, bullet points, concise tables).

--- CURRENT LIVE CRM DATABASE CONTEXT ---
${typeof crmContext === 'string' ? crmContext : JSON.stringify(crmContext, null, 2)}
----------------------------------------`;

      const formattedContents = [];

      // Add conversation history
      if (Array.isArray(history)) {
        for (const item of history) {
          if (
            item &&
            item.text &&
            (item.role === 'user' || item.role === 'model')
          ) {
            formattedContents.push({
              role: item.role,
              parts: [{ text: item.text }],
            });
          }
        }
      }

      // Add current user message
      formattedContents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const replyText = await callGeminiWithBackoff(ai, formattedContents, systemInstruction, model);
      return res.json({ reply: replyText });
    } catch (error: any) {
      console.error('Error in /api/gemini/chat:', error);
      const isMissingKey = error?.message?.includes('GEMINI_API_KEY');
      if (isMissingKey) {
        return res.status(500).json({
          error: 'Gemini service is not configured. Please check AI Studio Secrets.',
        });
      }

      if (isTransientGeminiError(error)) {
        return res.status(503).json({
          error: 'Gemini is temporarily busy. Please try again in a moment.',
        });
      }

      return res.status(500).json({
        error: 'Gemini is temporarily busy. Please try again in a moment.',
      });
    }
  });

  // Vite middleware in dev; static files in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback for SPA routing in development so direct navigation and refresh never 404
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api/')) {
        return next();
      }
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let html = await fs.promises.readFile(indexPath, 'utf-8');
        html = await vite.transformIndexHtml(url, html);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const distIndex = path.join(distPath, 'index.html');
      if (fs.existsSync(distIndex)) {
        res.sendFile(distIndex);
      } else {
        res.sendFile(path.join(process.cwd(), 'index.html'));
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vidzyra CRM server running on port ${PORT}`);
  });
}

startServer();
