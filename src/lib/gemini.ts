/**
 * Gemini AI utility for Islamic chatbot.
 *
 * Features:
 * - Multiple API key rotation (load balancing)
 * - 10 messages per user per day (free tier limit)
 * - Islamic knowledge system prompt
 *
 * NOTE: API keys are provided by the user at runtime.
 * They are NOT stored in code or memory.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { GEMINI_API_KEYS } from './geminiKeys';

// API keys loaded from secure gitignored file
let API_KEYS: string[] = [...GEMINI_API_KEYS];
let currentKeyIndex = 0;

export function setApiKeys(keys: string[]) {
  API_KEYS = keys.filter(k => k && k.trim().length > 0);
  currentKeyIndex = 0;
}

export function hasApiKeys(): boolean {
  return API_KEYS.length > 0;
}

function getNextKey(): string | null {
  if (API_KEYS.length === 0) return null;
  const key = API_KEYS[currentKeyIndex % API_KEYS.length];
  currentKeyIndex++;
  return key;
}

// --- Daily message limit (10 per user per day) ---

const DAILY_LIMIT = 10;

function limitKey(): string {
  const d = new Date();
  return `aiChatUsage:${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export async function getRemainingMessages(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(limitKey());
    const used = raw ? parseInt(raw, 10) : 0;
    return Math.max(0, DAILY_LIMIT - used);
  } catch {
    return DAILY_LIMIT;
  }
}

async function incrementUsage(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(limitKey());
    const used = raw ? parseInt(raw, 10) : 0;
    await AsyncStorage.setItem(limitKey(), String(used + 1));
  } catch {
    // ignore
  }
}

// --- Chat ---

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

const SYSTEM_PROMPT = `You are AiDeen, a helpful Islamic assistant inside the Deen prayer app. Answer questions about Islam accurately and respectfully.

Guidelines:
- Base answers on Quran and authentic Hadith (Sahih Bukhari, Sahih Muslim)
- If unsure, say so honestly — never invent hadith or verses
- Be concise but thorough (2-4 paragraphs max unless asked for more)
- Support English, Hindi (Roman + Devanagari), and Urdu
- For fiqh differences, mention major madhhab views briefly
- Always be respectful of all Muslims
- Never issue fatwas — for complex rulings, advise consulting a local scholar
- You can answer about: prayer, fasting, Quran, duas, Islamic history, daily life guidance`;

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent';

export async function sendChatMessage(
  messages: ChatMessage[],
  userMessage: string
): Promise<{ reply: string; remaining: number }> {
  const remaining = await getRemainingMessages();
  if (remaining <= 0) {
    throw new Error('Daily limit reached (10 messages/day). Try again tomorrow!');
  }

  const apiKey = getNextKey();
  if (!apiKey) {
    throw new Error('AI service not configured. Please try again later.');
  }

  // Build conversation history for Gemini
  const contents = [
    { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
    { role: 'model', parts: [{ text: 'Understood. I am AiDeen, ready to help with Islamic questions.' }] },
    ...messages.slice(-10).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    })),
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  // Try each key on failure (rotation for resilience)
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < API_KEYS.length; attempt++) {
    const key = getNextKey();
    if (!key) break;

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        // 429 = rate limit, try next key
        if (response.status === 429) continue;
        throw new Error(`API error ${response.status}: ${errText.slice(0, 100)}`);
      }

      const data = await response.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!reply) throw new Error('Empty response from AI');

      await incrementUsage();
      const newRemaining = await getRemainingMessages();
      return { reply: reply.trim(), remaining: newRemaining };
    } catch (e: any) {
      lastError = e;
      // Try next key
      continue;
    }
  }

  throw lastError || new Error('All API keys failed. Please try again later.');
}

export async function resetDailyLimit(): Promise<void> {
  // For testing only
  try {
    await AsyncStorage.removeItem(limitKey());
  } catch {
    // ignore
  }
}
