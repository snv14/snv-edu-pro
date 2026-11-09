import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ActionMenu } from '../src/components/ActionMenu';

test('secondary actions are grouped in a closed, keyboard-accessible disclosure', () => {
  const markup = renderToStaticMarkup(React.createElement(ActionMenu, {
    label: 'طباعة وتصدير',
    items: [
      { id: 'pdf', label: 'تصدير PDF', onSelect: () => {} },
      { id: 'word', label: 'تصدير Word', onSelect: () => {} },
    ],
  }));
  assert.match(markup, /<details(?![^>]*\sopen)/);
  assert.match(markup, /<summary[^>]*>طباعة وتصدير/);
  assert.match(markup, /id="pdf"/);
  assert.match(markup, /id="word"/);
  assert.match(markup, /type="button"/);
});
