import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createRateLimiter } from '../src/server/security';

test('AI rate limiter rejects excess requests', async () => {
  const app = express();
  app.use('/api/gemini', createRateLimiter({ windowMs: 60_000, max: 2 }));
  app.post('/api/gemini/generate', (_req, res) => res.sendStatus(200));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('No test port');
    const url = `http://127.0.0.1:${address.port}/api/gemini/generate`;
    assert.equal((await fetch(url, { method: 'POST' })).status, 200);
    assert.equal((await fetch(url, { method: 'POST' })).status, 200);
    const limited = await fetch(url, { method: 'POST' });
    assert.equal(limited.status, 429);
    assert.ok(limited.headers.get('retry-after'));
  } finally {
    server.close();
  }
});
