import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPatientSessionImportPayload, mergeRequestHeaders } from './api.js';

test('mergeRequestHeaders keeps the bearer token when extra headers are present', () => {
  const headers = mergeRequestHeaders(
    { 'Content-Type': 'application/json', Accept: 'application/json' },
    'demo-token'
  );

  assert.equal(headers.Authorization, 'Bearer demo-token');
  assert.equal(headers['Content-Type'], 'application/json');
  assert.equal(headers.Accept, 'application/json');
});

test('buildPatientSessionImportPayload uses the backend session_number field', () => {
  const payload = buildPatientSessionImportPayload({
    filename: 'patient.csv',
    sessions: [
      {
        sessionNumber: 4,
        measurements: [{ type: 'AFE', number: 4, impedance: 88.11 }],
      },
    ],
  });

  assert.deepEqual(payload, {
    filename: 'patient.csv',
    sessions: [
      {
        session_number: 4,
        measurements: [{ type: 'AFE', number: 4, impedance: 88.11 }],
      },
    ],
  });
});
