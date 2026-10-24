import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';

// Route validation must not use a real API key or contact the provider.
process.env.ANTHROPIC_API_KEY = 'test-key';
const { default: app } = await import('../api/health.js');

test('Vercel entry points share the Express app and preserve API routes', async t => {
  assert.equal((await import('../api/analyze.js')).default, app);
  assert.equal((await import('../api/translate.js')).default, app);

  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
    server.closeAllConnections();
  }));
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;

  const health = await fetch(`${base}/api/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { ok: true });

  const analyze = await fetch(`${base}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: 'invalid', mediaType: 'image/jpeg' }),
  });
  assert.equal(analyze.status, 400);
  assert.equal((await analyze.json()).error, 'Invalid image data');

  const translate = await fetch(`${base}/api/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.equal(translate.status, 400);
  assert.equal((await translate.json()).code, 'INVALID_TRANSLATION_INPUT');
});
