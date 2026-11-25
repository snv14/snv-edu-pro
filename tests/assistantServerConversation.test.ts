import test from 'node:test';
import assert from 'node:assert/strict';
import { apiApp } from '../src/server/api';

test('server enforces global conversational policy and contextual retrieval independently of browser scope', async () => {
  const originalFetch = globalThis.fetch;
  const keys = ['AI_PROVIDER', 'AI_PROVIDER_FALLBACKS', 'OPENAI_API_KEY', 'OPENAI_BASE_URL', 'GEMINI_API_KEY', 'GOOGLE_API_KEY', 'ANTHROPIC_API_KEY', 'HF_TOKEN', 'NOTEBOOKLM_BRIDGE_URL'];
  const previous = new Map(keys.map(key => [key, process.env[key]]));
  for (const key of keys) delete process.env[key];
  process.env.AI_PROVIDER = 'openai';
  process.env.AI_PROVIDER_FALLBACKS = 'openai';
  process.env.OPENAI_API_KEY = 'test-only';
  process.env.OPENAI_BASE_URL = 'https://provider.example/chat';
  let generatedPrompt = '';
  globalThis.fetch = (async (input: any, init: any) => {
    if (String(input) === process.env.OPENAI_BASE_URL) {
      generatedPrompt = JSON.parse(init.body).messages[0].content;
      return new Response(JSON.stringify({ choices: [{ message: { content: 'حسب المنهاج الرسمي، للسنة الرابعة متوسط: تجربة هضم آمنة [1]\nالمصدر: دليل الأستاذ' } }] }));
    }
    return originalFetch(input, init);
  }) as typeof fetch;
  const server = apiApp.listen(0, '127.0.0.1');
  try {
    if (!server.listening) await new Promise<void>(resolve => server.once('listening', resolve));
    const address = server.address() as import('node:net').AddressInfo;
    const response = await originalFetch(`http://127.0.0.1:${address.port}/api/gemini/smart-assistant`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'أضف تجربة', level: '1am', currentLesson: { level: '1am', ta3alom: 'موضوع مختلف' }, history: [{ role: 'user', text: 'اقترح نشاطاً حول الهضم' }, { role: 'assistant', text: 'مسودة نشاط تفاعلي' }], knowledgeContext: 'قيد قديم: ما عدا التدرج', knowledge: [{id: 'annual-browser', kind: 'progression', text: 'مقتطف تدرج محفوظ عند الأستاذ' }] }),
    });
    const result = await response.json();
    assert.equal(response.status, 200);
    assert.match(generatedPrompt, /جميع المستويات/);
    assert.match(generatedPrompt, /الهضم/);
    assert.match(generatedPrompt, /مسودة نشاط تفاعلي/);
    assert.match(generatedPrompt, /مقتطف تدرج محفوظ عند الأستاذ/);
    assert.doesNotMatch(generatedPrompt, /قيد قديم|موضوع مختلف|ما عدا التدرج/);
    assert.doesNotMatch(result.text, /المصدر|المنهاج|متوسط|\[1\]/);
    assert.equal(result.knowledgeSummary.level, 'all');
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
    globalThis.fetch = originalFetch;
    for (const [key, value] of previous) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});
