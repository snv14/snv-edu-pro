import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { KnowledgeBasePanel } from '../src/components/KnowledgeBasePanel';
import { AIAssistantDrawer } from '../src/components/AIAssistantChat';
import { DEFAULT_KNOWLEDGE_SETTINGS } from '../src/services/knowledgeLibraryStore';
import { getOfficialCurriculumDatabase } from '../src/data/memos/curriculumDb';

const lessons = getOfficialCurriculumDatabase();

test('the assistant chat is a free conversation with optional knowledge base access', () => {
  const markup = renderToStaticMarkup(React.createElement(AIAssistantDrawer, {
    isOpen: true,
    onClose: () => {},
    selectedLevel: '3am',
    currentLesson: null,
    curriculumLessons: lessons,
  }));

  assert.match(markup, /محادثة حرة/);
  assert.match(markup, /كيف أساعدك اليوم/);
  assert.match(markup, /اقترح نشاطًا حول الهضم/);
  assert.doesNotMatch(markup, /إرساء الموارد|KNOWLEDGE_QUICK_TASKS/);
  assert.match(markup, /تصفح قاعدة المعرفة/);
  assert.match(markup, /إجابات من المصادر فقط/);
  assert.match(markup, /placeholder="اكتب سؤالك/);
  assert.doesNotMatch(markup, /إرساء الموارد|اختر المستوى|استخراج مباشر/);
  assert.match(markup, /aria-label="محادثة المساعد التربوي"/);
});

test('the knowledge base panel shows the four source families, their sizes and the teacher upload form', () => {
  const markup = renderToStaticMarkup(React.createElement(KnowledgeBasePanel, {
    selectedLevel: '2am',
    lessons,
    settings: DEFAULT_KNOWLEDGE_SETTINGS,
    onSettingsChange: () => {},
    onClose: () => {},
  }));

  assert.match(markup, /قاعدة معرفة المساعد/);
  assert.match(markup, /المنهاج/);
  assert.match(markup, /الوثيقة المرافقة/);
  assert.match(markup, /دليل الأستاذ/);
  assert.match(markup, /المذكرات/);
  assert.match(markup, /التدرج والتوزيع السنوي/);
  assert.match(markup, /href="\/assets\/official\/learning-plan-1am-2021-2022\.pdf"/);
  assert.match(markup, /aria-label="فتح المصدر: [^"]*السنة الأولى متوسط \(2021\/2022\)"/);
  assert.match(markup, /href="\/assets\/official\/learning-plan-3am-2021-2022\.pdf"/);
  assert.match(markup, /aria-label="فتح المصدر: [^"]*السنة الثالثة متوسط \(2021\/2022\)"/);
  assert.match(markup, /اختبار البحث في القاعدة/);
  assert.match(markup, /إضافة وثيقة/);
  assert.match(markup, /الاستخراج المباشر دون ذكاء اصطناعي/);
  // يجب أن يعرض عدداً حقيقياً من المقاطع المفهرسة لا صفراً.
  assert.doesNotMatch(markup, /إجمالي المقاطع المفهرسة: <strong class="text-slate-800">0</);
});

test('chat uses only the shared modern avatar and keeps legacy sidebar tools in one collapsible panel', () => {
  const markup = renderToStaticMarkup(React.createElement(AIAssistantDrawer, {
    isOpen: true, mode: 'section', selectedLevel: '4am', currentLesson: null, curriculumLessons: lessons,
  }));
  assert.doesNotMatch(markup, /<aside|lucide-bot/);
  assert.match(markup, /assistant-avatar--large/);
  assert.match(markup, /assistant-avatar--medium/);
  assert.equal((markup.match(/id="assistant-tools-panel"/g) || []).length, 1);
  assert.match(markup, /aria-controls="assistant-tools-panel"/);
  assert.match(markup, /المحادثات السابقة/);
  assert.match(markup, /مساحات المعرفة/);
  assert.match(markup, /إنشاء مساحة معرفة/);
  assert.match(markup, /تصفح قاعدة المعرفة/);
  assert.match(markup, /إجابات من المصادر فقط/);
  assert.match(markup, /type="file"/);
});
