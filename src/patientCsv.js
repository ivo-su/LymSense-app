function parseCsvRows(content) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];

    if (inQuotes) {
      if (character === '"' && content[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        inQuotes = false;
      } else {
        field += character;
      }
    } else if (character === '"' && field.length === 0) {
      inQuotes = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && content[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (inQuotes) throw new Error("El CSV contiene comillas sin cerrar.");
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  }
  return rows;
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function findMetadataRow(rows, key) {
  return rows.findIndex((row) => row[0]?.trim().toUpperCase() === key);
}

const PATIENT_CSV_FILENAME_PATTERN = /^S(\d{3})\.CSV$/i;

export function isPatientCsvFilename(filename) {
  return PATIENT_CSV_FILENAME_PATTERN.test(filename);
}

export function getNextPatientCsvFilename(filenames) {
  const numbers = filenames
    .map((filename) => filename.match(PATIENT_CSV_FILENAME_PATTERN)?.[1])
    .filter(Boolean)
    .map(Number);
  const nextNumber = Math.max(0, ...numbers) + 1;
  if (nextNumber > 999) {
    throw new Error("No se pueden crear más archivos: se alcanzó el número S999.CSV.");
  }
  return `S${String(nextNumber).padStart(3, "0")}.CSV`;
}

export function parsePatientCsv(content) {
  const rows = parseCsvRows(content);
  const patientRow = findMetadataRow(rows, "PACIENTE");
  const idRow = findMetadataRow(rows, "ID_CLINICO");
  const uploadedRow = findMetadataRow(rows, "ULTIMO_SUBIDO");
  const patientName = patientRow === -1 ? "" : rows[patientRow][1]?.trim() ?? "";
  const patientId = idRow === -1 ? "" : rows[idRow][1]?.trim() ?? "";
  const uploadedValue = uploadedRow === -1 ? "" : rows[uploadedRow][1]?.trim() ?? "";

  if (uploadedValue && !/^\d+$/.test(uploadedValue)) {
    throw new Error("ULTIMO_SUBIDO debe ser un número entero igual o mayor que cero.");
  }

  const headerRow = rows.findIndex((row) =>
    row.slice(0, 3).map((cell) => cell.trim().toLowerCase()).join(",") === "tipo,numero,impedancia"
  );
  const sessions = new Map();
  if (headerRow !== -1) {
    rows.slice(headerRow + 1).forEach((row) => {
      if (row.every((cell) => cell.trim() === "")) return;
      if (row.length !== 3) {
        throw new Error(`La fila debe tener tipo, número e impedancia: ${row.join(",")}`);
      }
      const [typeValue, numberValue, impedanceValue] = row.map((cell) => cell.trim());
      const type = typeValue.toUpperCase();
      const number = Number(numberValue);
      const impedance = Number(impedanceValue.replace(",", "."));

      if (!["REF", "AFE"].includes(type) || !Number.isInteger(number) || number < 1) {
        throw new Error(`Fila de medición inválida: ${row.join(",")}`);
      }
      if (impedanceValue === "" || !Number.isFinite(impedance)) {
        throw new Error(`La impedancia debe ser numérica en la fila: ${row.join(",")}`);
      }

      if (!sessions.has(number)) sessions.set(number, []);
      const measurements = sessions.get(number);
      if (measurements.some((measurement) => measurement.type === type)) {
        throw new Error(`La sesión ${number} contiene más de una lectura ${type}.`);
      }
      measurements.push({ type, number: Number(numberValue), impedance });
    });
  }

  return {
    patientName,
    patientId,
    lastUploaded: uploadedValue ? Number(uploadedValue) : 0,
    sessions: [...sessions.entries()]
      .sort(([first], [second]) => first - second)
      .map(([sessionNumber, measurements]) => ({ sessionNumber, measurements })),
    rows,
  };
}

export function updatePatientCsv(content, patient, lastUploaded) {
  const rows = parseCsvRows(content);
  const missingMetadata = [];
  const metadata = [
    ["PACIENTE", patient.name],
    ["ID_CLINICO", patient.id],
    ["ULTIMO_SUBIDO", lastUploaded],
  ];

  metadata.forEach(([key, value]) => {
    const rowIndex = findMetadataRow(rows, key);
    if (rowIndex === -1) {
      missingMetadata.push([key, String(value)]);
    } else {
      rows[rowIndex] = [rows[rowIndex][0], String(value), ...rows[rowIndex].slice(2)];
    }
  });
  rows.unshift(...missingMetadata);

  if (!rows.some((row) =>
    row.slice(0, 3).map((cell) => cell.trim().toLowerCase()).join(",") === "tipo,numero,impedancia"
  )) {
    rows.push(["tipo", "numero", "impedancia"]);
  }

  return rows.map((row) => row.map(csvEscape).join(",")).join("\n") + "\n";
}

export function createPatientCsv(patient) {
  return [
    ["PACIENTE", patient.name],
    ["ID_CLINICO", patient.id],
    ["ULTIMO_SUBIDO", 0],
    ["tipo", "numero", "impedancia"],
  ].map((row) => row.map(csvEscape).join(",")).join("\n") + "\n";
}
