import test from "node:test";
import assert from "node:assert/strict";
import { getFixedReferenceRatios, getSessionReferenceRatios } from "./lineGraphData.js";

const logs = [
  { id: 1, session_number: 1, measurements: [
    { type: "REF", impedance: 100 },
    { type: "AFE", impedance: 50 },
  ] },
  { id: 2, session_number: 2, measurements: [
    { type: "AFE", impedance: 25 },
  ] },
  { id: 3, session_number: 3, measurements: [
    { type: "REF", impedance: 120 },
  ] },
  { id: 4, session_number: 4, measurements: [
    { type: "AFE", impedance: 30 },
  ] },
  { id: 5, session_number: 5, measurements: [
    { type: "AFE", impedance: 0 },
  ] },
];

test("uses the current REF or nearest earlier REF for each AFE session", () => {
  const legacyLog = { id: 6, ldex: 2, z_healthy: 100, z_risk: 50 };
  assert.deepEqual(getSessionReferenceRatios([...logs, legacyLog].reverse()), {
    labels: [1, 2, 3, 4, 5],
    values: [2, 4, null, 4, null],
  });
});

test("uses the user-selected REF measurement as a fixed reference for all AFE sessions", () => {
  assert.deepEqual(getFixedReferenceRatios(logs, logs[2]), {
    labels: [1, 2, 3, 4, 5],
    values: [2.4, 4.8, null, 4, null],
  });
});

test("leaves AFE sessions without any earlier REF without a ratio", () => {
  const sessions = [
    { id: 1, session_number: 1, measurements: [{ type: "AFE", impedance: 40 }] },
    { id: 2, session_number: 2, measurements: [
      { type: "REF", impedance: 80 },
      { type: "AFE", impedance: 20 },
    ] },
  ];

  assert.deepEqual(getSessionReferenceRatios(sessions), {
    labels: [1, 2],
    values: [null, 4],
  });
});
