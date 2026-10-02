import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeRequestHeaders } from './api.js';

test('mergeRequestHeaders keeps the bearer token when extra headers are present', () => {
  const headers = mergeRequestHeaders(
    { 'Content-Type': 'application/json', Accept: 'application/json' },
    'demo-token'
  );

  assert.equal(headers.Authorization, 'Bearer demo-token');
  assert.equal(headers['Content-Type'], 'application/json');
  assert.equal(headers.Accept, 'application/json');
});
