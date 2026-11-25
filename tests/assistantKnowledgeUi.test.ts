import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { KnowledgeBasePanel } from '../src/components/KnowledgeBasePanel';
import { AIAssistantDrawer } from '../src/components/AIAssistantChat';
import { DEFAULT_KNOWLEDGE_SETTINGS } from '../src/services/knowledgeLibraryStore';
import { getOfficialCurriculumDatabase } from '../src/data/memos/curriculumDb';

const lessons = getOfficialCurriculumDatabase();

test('the assistant starts as a free conversation without prerequisite selectors or source panels', () => {
  const markup = renderToStaticMarkup(React.createElement(AIAssistantDrawer, {
    isOpen: true,
    onClose: () => {},
    selectedLevel: '3am',
    currentLesson: null,
    curriculumLessons: lessons,
  }));

  assert.match(markup, /كيف أساعدك اليوم/);
  assert.match(markup, /aria-label="رسالتك إلى المساعد"/);
  assert.match(markup, /aria-label="إرسال"/);
  assert.match(markup, /aria-label="إرفاق ملف"/);
  assert.match(markup, /aria-label="أدوات المحادثة"/);
  assert.doesNotMatch(markup, /<select|النطاق الحالي|قاعدة المعرفة|استخرج الأنشطة|السنة الثالثة|3am|مصادر الويب/);
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
