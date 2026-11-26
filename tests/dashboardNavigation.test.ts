import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlatformNavigationDrawer } from '../src/components/PlatformNavigationDrawer';
import type { MemoConfig } from '../src/types';
const props = {
  isOpen: true, onClose() {}, activeSection: 'home', onNavigate() {}, onOpenTimetable() {},
  onOpenInfoModal() {}, config: {} as MemoConfig,
};
test('desktop dashboard renders one modern rail without duplicating the legacy vertical menu', () => {
  const markup = renderToStaticMarkup(React.createElement(PlatformNavigationDrawer, { ...props, variant: 'sidebar' }));
  assert.equal((markup.match(/class="overview-rail"/g) || []).length, 1);
  assert.doesNotMatch(markup, /overview-sidebar__panel|الواجهة والسنوات الدراسية|إعدادات الحساب والخاتم/);
  assert.match(markup, /aria-label="المساعد الذكي"/);
  assert.match(markup, /aria-label="التقويم"/);
});
test('full navigation remains available on demand with all existing year, service and support actions', () => {
  const markup = renderToStaticMarkup(React.createElement(PlatformNavigationDrawer, props));
  assert.doesNotMatch(markup, /class="overview-rail"/);
  for (const label of ['السنة الأولى', 'السنة الثانية', 'السنة الثالثة', 'السنة الرابعة', 'استعمال الزمن', 'الموارد التعليمية', 'التقويم', 'المساعد الذكي', 'الخاتم', 'حول المنصة', 'الدليل', 'تواصل']) {
    assert.ok(markup.includes(label), label);
  }
});
