import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
dotenv.config({ path: '.env.local' });
dotenv.config();

export type ServerAIProvider = 'gemini' | 'openai' | 'anthropic' | 'huggingface';

const getGeminiApiKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

const configured = (provider: ServerAIProvider) => {
  if (provider === 'gemini') return Boolean(getGeminiApiKey());
  if (provider === 'openai') return Boolean(process.env.OPENAI_API_KEY);
  if (provider === 'anthropic') return Boolean(process.env.ANTHROPIC_API_KEY);
  return Boolean(process.env.HF_TOKEN);
};

const providerOrder = (): ServerAIProvider[] => {
  const requested = String(process.env.AI_PROVIDER || 'gemini')
    .split(',')
    .map(x => x.trim())
    .filter(Boolean) as ServerAIProvider[];
  const fallback = String(process.env.AI_PROVIDER_FALLBACKS || 'gemini,openai,anthropic,huggingface')
    .split(',')
    .map(x => x.trim())
    .filter(Boolean) as ServerAIProvider[];
  return [...new Set([...requested, ...fallback])].filter(configured);
};

async function callGemini(prompt: string): Promise<string> {
  const model = process.env.GEMINI_MODEL && !process.env.GEMINI_MODEL.includes('2.5') && !process.env.GEMINI_MODEL.includes('2.0') && !process.env.GEMINI_MODEL.includes('1.5')
    ? process.env.GEMINI_MODEL
    : 'gemini-3.8-flash';
  const ai = new GoogleGenAI({
    apiKey: getGeminiApiKey(),
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });
  return String(response.text || '');
}

async function callOpenAI(prompt: string): Promise<string> {
  const response = await fetch(process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }),
  });
  if (!response.ok) throw new Error(`OpenAI provider HTTP ${response.status}`);
  const data: any = await response.json();
  return String(data?.choices?.[0]?.message?.content || '');
}

async function callAnthropic(prompt: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': String(process.env.ANTHROPIC_API_KEY),
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!response.ok) throw new Error(`Anthropic provider HTTP ${response.status}`);
  const data: any = await response.json();
  return Array.isArray(data?.content) ? data.content.map((x: any) => x?.text || '').join('') : '';
}

async function callHuggingFace(prompt: string): Promise<string> {
  const model = process.env.HF_MODEL || 'Qwen/Qwen2.5-7B-Instruct';
  const response = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.HF_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 4096, temperature: 0.2, return_full_text: false } }),
  });
  if (!response.ok) throw new Error(`Hugging Face provider HTTP ${response.status}`);
  const data: any = await response.json();
  if (Array.isArray(data)) return String(data[0]?.generated_text || '');
  return String(data?.generated_text || '');
}

export async function generateTextWithGateway(prompt: string): Promise<{ text: string; provider: ServerAIProvider }> {
  const errors: string[] = [];
  for (const provider of providerOrder()) {
    try {
      let text = '';
      if (provider === 'gemini') text = await callGemini(prompt);
      else if (provider === 'openai') text = await callOpenAI(prompt);
      else if (provider === 'anthropic') text = await callAnthropic(prompt);
      else if (provider === 'huggingface') text = await callHuggingFace(prompt);
      else continue;
      if (text.trim()) return { text, provider };
    } catch (error) {
      errors.push(`${provider}: ${error instanceof Error ? error.message : 'failed'}`);
    }
  }
  throw new Error(`لا يوجد مزود AI نصي متاح حالياً. ${errors.join(' | ')}`);
}

export function getAIProviderStatus() {
  return {
    primary: providerOrder()[0] || null,
    available: providerOrder(),
    freeFirst: !process.env.AI_PROVIDER || process.env.AI_PROVIDER === 'gemini',
    note: 'لا يتم إرسال المرفقات إلى مزود بديل تلقائياً؛ تحليل الصور/PDF يبقى عبر مزود يدعم الرؤية.',
  };
}
