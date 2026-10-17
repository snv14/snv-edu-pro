import fs from 'node:fs';
import path from 'node:path';

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const ROOT = process.cwd();
const FILE = path.join(ROOT, 'data', 'aiKnowledge.json');

if (!API_KEY) {
  throw new Error('GEMINI_API_KEY is required for knowledge refresh');
}

const current = JSON.parse(fs.readFileSync(FILE, 'utf8'));

const prompt = [
  'أنت نظام تحديث معرفة لمساعد أستاذ علوم الطبيعة والحياة في التعليم المتوسط بالجزائر.',
  'ابحث في الإنترنت عن مستجدات موثوقة منذ آخر تحديث، مع أولوية قصوى للمصادر الرسمية الجزائرية، ثم المصادر العلمية الموثوقة.',
  'ركز على: المناهج والتدرجات والوثائق البيداغوجية، التنظيمات المدرسية التي تؤثر على الأستاذ، موارد التعليم المتوسط، ومستجدات علمية يمكن أن تفيد تدريس علوم الطبيعة والحياة.',
  'لا تعتبر منشوراً في موقع غير رسمي تغييراً للمنهاج. أي ادعاء رسمي يجب أن يكون له مصدر رسمي.',
  'لا تكرر المعلومات القديمة إلا إذا تغيرت أو تحتاج تصحيحاً.',
  'أعد JSON فقط بهذا الشكل:',
  '{"updates":[{"title":"...","summary":"...","date":"YYYY-MM-DD","level":"1am|2am|3am|4am|all|unknown","topic":"curriculum|pedagogy|science|official_update","importance":"high|medium|low","sourceTitle":"...","sourceUrl":"...","sourceType":"official|scientific|web","confidence":"high|medium|low"}]}',
  'عدد النتائج الأقصى 15.',
  'لا تخترع روابط. إذا لم تجد تحديثاً موثوقاً أعد قائمة فارغة.',
  '',
  'المعرفة الحالية:',
  JSON.stringify(current, null, 2),
].join('\n');

const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(API_KEY)}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  },
);

if (!response.ok) {
  throw new Error(`Gemini refresh failed: ${response.status} ${await response.text()}`);
}

const payload = await response.json();
const raw = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '{"updates":[]}';
let parsed;
try {
  parsed = JSON.parse(raw);
} catch {
  throw new Error('Gemini returned invalid JSON during knowledge refresh');
}

const allowedTopics = new Set(['curriculum', 'pedagogy', 'science', 'official_update', 'web_update']);
const allowedImportance = new Set(['high', 'medium', 'low']);
const allowedConfidence = new Set(['high', 'medium', 'low']);
const clean = Array.isArray(parsed.updates)
  ? parsed.updates
      .filter((item) => item && item.title && item.summary && item.sourceUrl)
      .map((item) => ({
        title: String(item.title).slice(0, 240),
        summary: String(item.summary).slice(0, 1200),
        date: /^\\d{4}-\\d{2}-\\d{2}$/.test(String(item.date)) ? String(item.date) : new Date().toISOString().slice(0, 10),
        level: String(item.level || 'unknown'),
        topic: allowedTopics.has(item.topic) ? item.topic : 'web_update',
        importance: allowedImportance.has(item.importance) ? item.importance : 'medium',
        sourceTitle: String(item.sourceTitle || item.sourceUrl).slice(0, 240),
        sourceUrl: String(item.sourceUrl),
        sourceType: ['official', 'scientific', 'web'].includes(item.sourceType) ? item.sourceType : 'web',
        confidence: allowedConfidence.has(item.confidence) ? item.confidence : 'medium',
      }))
      .slice(0, 15)
  : [];

const now = new Date().toISOString();
const existing = Array.isArray(current.updates) ? current.updates : [];
const merged = [...clean, ...existing]
  .filter((item, index, arr) => arr.findIndex((x) => x.sourceUrl === item.sourceUrl && x.title === item.title) === index)
  .slice(0, 60);

current.updatedAt = now;
current.updates = merged;
current.lastRefresh = {
  at: now,
  resultCount: clean.length,
  searchUsed: true,
};

fs.writeFileSync(FILE, JSON.stringify(current, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({ updatedAt: now, added: clean.length }));
