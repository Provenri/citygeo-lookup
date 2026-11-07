import assert from 'node:assert/strict';
import { test } from 'node:test';
import { askAssistant } from './assistant.js';

const messages = [{ role: 'user', content: 'What is the capital of France?' }];
const ok = content => ({
  ok: true,
  status: 200,
  json: async () => ({ choices: [{ message: { content } }] })
});

test('uses only the free router and returns a validated city suggestion', async () => {
  let request;
  const result = await askAssistant(messages, 'test-key', async (url, options) => {
    request = { url, ...options };
    return ok(JSON.stringify({ answer: 'Paris is the capital of France.', city: 'Paris, France' }));
  });
  assert.deepEqual(result, { answer: 'Paris is the capital of France.', city: 'Paris, France' });
  assert.equal(request.url, 'https://openrouter.ai/api/v1/chat/completions');
  assert.equal(request.headers.Authorization, 'Bearer test-key');
  const body = JSON.parse(request.body);
  assert.equal(body.model, 'openrouter/free');
  assert.equal(body.provider.require_parameters, true);
  assert.equal(body.response_format.type, 'json_schema');
  assert.equal(body.reasoning.effort, 'low');
  assert.equal(body.max_tokens, 2048);
  assert.deepEqual(body.messages.slice(1), messages);
  assert.ok(request.signal instanceof AbortSignal);
});

test('reports truncated responses explicitly', async () => {
  const truncated = {
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ finish_reason: 'length', message: { content: null } }] })
  };
  await assert.rejects(askAssistant(messages, 'test-key', async () => truncated), {
    status: 502,
    message: 'The AI response was incomplete. Please try again with a shorter question.'
  });
});

test('supports follow-up questions without a city', async () => {
  const result = await askAssistant(messages, 'test-key', async () =>
    ok(JSON.stringify({ answer: 'Which country do you mean?', city: null })));
  assert.deepEqual(result, { answer: 'Which country do you mean?', city: null });
});

test('rejects malformed, empty, and oversized model output', async () => {
  for (const content of [
    'not json',
    JSON.stringify({ answer: '', city: null }),
    JSON.stringify({ answer: 'Hello' }),
    JSON.stringify({ answer: 'Hello', city: 'x'.repeat(121) }),
    JSON.stringify({ answer: 'x'.repeat(2001), city: null })
  ]) {
    await assert.rejects(askAssistant(messages, 'test-key', async () => ok(content)), { status: 502 });
  }
});

test('surfaces provider rate limits, outages, timeouts, and invalid JSON', async () => {
  await assert.rejects(askAssistant(messages, 'test-key', async () => ({ ok: false, status: 429 })), { status: 429 });
  await assert.rejects(askAssistant(messages, 'test-key', async () => ({ ok: false, status: 401 })), { status: 503 });
  await assert.rejects(askAssistant(messages, 'test-key', async () => {
    throw new DOMException('Timed out', 'TimeoutError');
  }), { status: 504 });
  await assert.rejects(askAssistant(messages, 'test-key', async () => ({
    ok: true, status: 200, json: async () => { throw new SyntaxError('bad json'); }
  })), { status: 503 });
});
