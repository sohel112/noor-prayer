/**
 * Gemini AI utility for Islamic chatbot.
 *
 * Features:
 * - Multiple API key rotation (load balancing)
 * - 10 messages per user per day (free tier limit)
 * - Islamic knowledge system prompt
 * NOTE: API keys are provided by the user at runtime.
 * They are NOT stored in code or memory.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';

// AI chat now goes through Supabase Edge Function (server-side Gemini key).
// No client-side API keys needed.
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/aideen-chat`;

export function setApiKeys(_keys: string[]) {
  // Kept for compatibility — keys are now server-side.
}

export function hasApiKeys(): boolean {
  return true; // Backend handles the key
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

export async function sendChatMessage(
  messages: ChatMessage[],
  userMessage: string
): Promise<{ reply: string; remaining: number }> {
  const remaining = await getRemainingMessages();
  if (remaining <= 0) {
    throw new Error('Daily limit reached (10 messages/day). Try again tomorrow!');
  }

  const allMessages: ChatMessage[] = [...messages.slice(-10), { role: 'user', text: userMessage }];

  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ messages: allMessages }),
    });

    if (!response.ok) {
      throw new Error(`AI service error (${response.status})`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }

    await incrementUsage();
    const newRemaining = await getRemainingMessages();
    return { reply: data.reply || 'Sorry, no response received.', remaining: newRemaining };
  } catch (e: any) {
    throw new Error(e.message || 'AI service unavailable. Please try again.');
  }
}

export async function resetDailyLimit(): Promise<void> {
  await AsyncStorage.removeItem(limitKey());
}
