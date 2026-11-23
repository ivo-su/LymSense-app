import test from "node:test";
import assert from "node:assert/strict";
import {
  createPatientCsv,
  getNextPatientCsvFilename,
  isPatientCsvFilename,
  parsePatientCsv,
  updatePatientCsv,
} from "./patientCsv.js";

const sampleCsv = [
  "PACIENTE,John Doe",
  "ID_CLINICO,11111",
  "ULTIMO_SUBIDO, 3",
  "tipo,numero,impedancia",
  "REF,1,674.10",
  "AFE,1,669.11",
  "AFE,2,668.16",
  "AFE,3,88.11",
  "AFE,4,88.11",
  "AFE,5,88.11",
  "AFE,6,88.11",
  "REF,6,88.11",
].join("\n");

test("parses metadata and groups partial readings by session", () => {
  const parsed = parsePatientCsv(sampleCsv);

  assert.equal(parsed.patientId, "11111");
  assert.equal(parsed.lastUploaded, 3);
  assert.deepEqual(parsed.sessions.map(({ sessionNumber, measurements }) => [
    sessionNumber,
    measurements.map(({ type }) => type),
  ]), [
    [1, ["REF", "AFE"]],
    [2, ["AFE"]],
    [3, ["AFE"]],
    [4, ["AFE"]],
    [5, ["AFE"]],
    [6, ["AFE", "REF"]],
  ]);
});

test("updates metadata without changing the existing measurements", () => {
  const updated = updatePatientCsv(sampleCsv, { id: 8, name: "Jane, Doe" }, 5);
  const parsed = parsePatientCsv(updated);

  assert.equal(parsed.patientName, "Jane, Doe");
  assert.equal(parsed.patientId, "8");
  assert.equal(parsed.lastUploaded, 5);
  assert.equal(parsed.sessions.length, 6);
});

test("creates a valid empty CSV for a patient", () => {
  const parsed = parsePatientCsv(createPatientCsv({ id: 8, name: "Jane Doe" }));

  assert.equal(parsed.patientId, "8");
  assert.equal(parsed.lastUploaded, 0);
  assert.deepEqual(parsed.sessions, []);
});

test("accepts only SNNN.CSV filenames and creates the next number", () => {
  assert.equal(isPatientCsvFilename("S001.CSV"), true);
  assert.equal(isPatientCsvFilename("s042.csv"), true);
  assert.equal(isPatientCsvFilename("patient-1.csv"), false);
  assert.equal(isPatientCsvFilename("S1000.CSV"), false);
  assert.equal(getNextPatientCsvFilename(["S001.CSV", "S003.CSV"]), "S004.CSV");
  assert.equal(getNextPatientCsvFilename([]), "S001.CSV");
});

test("rejects CSV creation when all three-digit file numbers are used", () => {
  assert.throws(
    () => getNextPatientCsvFilename(["S999.CSV"]),
    /se alcanzó el número S999\.CSV/,
  );
});
