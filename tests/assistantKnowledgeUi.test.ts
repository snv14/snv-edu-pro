import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { KnowledgeBasePanel } from '../src/components/KnowledgeBasePanel';
import { AIAssistantDrawer } from '../src/components/AIAssistantChat';
import { DEFAULT_KNOWLEDGE_SETTINGS } from '../src/services/knowledgeLibraryStore';
import { getOfficialCurriculumDatabase } from '../src/data/curriculumDb';

const lessons = getOfficialCurriculumDatabase();

test('the assistant chat exposes the knowledge base and its extraction tasks', () => {
  const markup = renderToStaticMarkup(React.createElement(AIAssistantDrawer, {
    isOpen: true,
    onClose: () => {},
    selectedLevel: '3am',
    currentLesson: null,
    curriculumLessons: lessons,
  }));

  assert.match(markup, /قاعدة المعرفة/);
  assert.match(markup, /استخرج الأنشطة/);
  assert.match(markup, /المشكلة والفرضية/);
  assert.match(markup, /إرساء الموارد/);
  assert.match(markup, /اقترح تمريناً/);
  assert.match(markup, /استخراج مباشر/);
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
  assert.match(markup, /اختبار البحث في القاعدة/);
  assert.match(markup, /إضافة وثيقة/);
  assert.match(markup, /الاستخراج المباشر دون ذكاء اصطناعي/);
  // يجب أن يعرض عدداً حقيقياً من المقاطع المفهرسة لا صفراً.
  assert.doesNotMatch(markup, /إجمالي المقاطع المفهرسة: <strong class="text-slate-800">0</);
});
