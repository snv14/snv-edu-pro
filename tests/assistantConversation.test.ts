import test from 'node:test';
import assert from 'node:assert/strict';
import { conversationContext, loadConversation, saveConversation, clearConversation, MAX_CONTEXT_MESSAGES } from '../src/services/conversationHistory';

const makeMessages = (count: number) => Array.from({ length: count }, (_, index) => ({
  role: (index % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
  text: `رسالة ${index + 1}`,
}));

test('conversation context keeps only the most recent messages and drops empty text', () => {
  const long = [...makeMessages(30), { role: 'assistant' as const, text: '   ' }];
  const context = conversationContext(long);
  assert.equal(context.length, MAX_CONTEXT_MESSAGES);
  assert.equal(context[context.length - 1].text, 'رسالة 30');
  assert.ok(context.every(item => item.text.trim().length > 0));
});

test('conversation is stored per level and restored in order', () => {
  const memory = new Map<string, string>();
  const fakeStorage = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => { memory.set(key, value); },
    removeItem: (key: string) => { memory.delete(key); },
  };
  (globalThis as any).window = { localStorage: fakeStorage };

  const messages = makeMessages(3);
  saveConversation(messages, '2am');
  saveConversation(makeMessages(2), '4am');

  assert.deepEqual(loadConversation('2am')?.messages.map(item => item.text), ['رسالة 1', 'رسالة 2', 'رسالة 3']);
  assert.equal(loadConversation('2am')?.messages[0].role, 'user');
  assert.equal(loadConversation('4am')?.messages.length, 2);

  clearConversation('2am');
  assert.equal(loadConversation('2am'), null);
});

test('corrupted stored conversations are ignored instead of breaking the chat', () => {
  const memory = new Map<string, string>([['assistant_conversation_v2_all', '{not json']]);
  (globalThis as any).window = {
    localStorage: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => { memory.set(key, value); },
      removeItem: (key: string) => { memory.delete(key); },
    },
  };
  assert.equal(loadConversation(), null);
});
