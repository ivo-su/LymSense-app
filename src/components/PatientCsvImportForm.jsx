import { useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import SelectInput from "./SelectInput";
import {
  createPatientCsv,
  getNextPatientCsvFilename,
  isPatientCsvFilename,
  parsePatientCsv,
  updatePatientCsv,
} from "../patientCsv";
import { importPatientSessions } from "../api";

function PatientCsvImportForm({ patient, onSaved }) {
  const [directory, setDirectory] = useState("");
  const [files, setFiles] = useState([]);
  const [selectedPath, setSelectedPath] = useState("");
  const [activeFile, setActiveFile] = useState(null);
  const [pendingSessions, setPendingSessions] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const selectedFile = files.find((file) => file.path === selectedPath);
  const selectedFileMatchesPatient = selectedFile?.csv?.patientId === String(patient.id);
  const hasAssignedPatientFile = files.some((file) => file.csv?.patientId === String(patient.id));

  const loadDirectory = async () => {
    setError("");
    setStatus("");
    setActiveFile(null);
    setPendingSessions([]);

    if (!isTauri()) {
      setError("La lectura y actualización de la tarjeta SD está disponible desde la aplicación de escritorio.");
      return;
    }

    try {
      setIsBusy(true);
      const [{ open }, { readDir, readTextFile }, { join }] = await Promise.all([
        import("@tauri-apps/plugin-dialog"),
        import("@tauri-apps/plugin-fs"),
        import("@tauri-apps/api/path"),
      ]);
      const selectedDirectory = await open({
        directory: true,
        multiple: false,
        title: "Selecciona la carpeta de la tarjeta SD",
      });
      if (!selectedDirectory) return;

      const entries = await readDir(selectedDirectory);
      const csvEntries = entries.filter((entry) =>
        entry.isFile && isPatientCsvFilename(entry.name ?? "")
      );
      const candidates = await Promise.all(csvEntries.map(async (entry) => {
        const path = await join(selectedDirectory, entry.name);
        try {
          const content = await readTextFile(path);
          return { name: entry.name, path, content, csv: parsePatientCsv(content) };
        } catch (fileError) {
          return { name: entry.name, path, error: fileError.message };
        }
      }));

      setDirectory(selectedDirectory);
      setFiles(candidates);
      if (candidates.length === 0) {
        setSelectedPath("");
        setStatus("No se encontraron archivos CSV. Puedes crear uno para este paciente.");
        return;
      }

      const matches = candidates.filter((file) => file.csv?.patientId === String(patient.id));
      if (matches.length === 1) {
        setSelectedPath(matches[0].path);
        setStatus(`Se encontró un archivo asociado al paciente: ${matches[0].name}.`);
      } else if (matches.length > 1) {
        setSelectedPath("");
        setStatus("Se encontraron varios archivos asociados. Selecciona cuál deseas leer.");
      } else {
        setSelectedPath("");
        setStatus("No se encontró un archivo con el ID de este paciente. Selecciona un CSV para asignarlo.");
      }
    } catch (directoryError) {
      setError(directoryError.message);
    } finally {
      setIsBusy(false);
    }
  };

  const createPatientFile = async () => {
    setError("");
    setStatus("");
    if (!directory) {
      setError("Primero selecciona la carpeta de la tarjeta SD.");
      return;
    }

    try {
      setIsBusy(true);
      const [{ writeTextFile }, { join }] = await Promise.all([
        import("@tauri-apps/plugin-fs"),
        import("@tauri-apps/api/path"),
      ]);
      const filename = getNextPatientCsvFilename(files.map((file) => file.name));

      const path = await join(directory, filename);
      const content = createPatientCsv(patient);
      await writeTextFile(path, content);
      const csv = parsePatientCsv(content);
      setFiles((currentFiles) => [...currentFiles, { name: filename, path, content, csv }]);
      setSelectedPath(path);
      setActiveFile({ name: filename, path, content, csv });
      setPendingSessions([]);
      setStatus(`Se creó ${filename} con los datos del paciente. Todavía no hay mediciones para subir.`);
    } catch (createError) {
      setError(createError.message);
    } finally {
      setIsBusy(false);
    }
  };

  const readSelectedFile = async () => {
    setError("");
    setStatus("");
    setPendingSessions([]);
    if (!selectedFile) {
      setError("Selecciona un archivo CSV.");
      return;
    }
    if (selectedFile.error) {
      setError(`No se pudo leer ${selectedFile.name}: ${selectedFile.error}`);
      return;
    }

    try {
      setIsBusy(true);
      const { writeTextFile, readTextFile } = await import("@tauri-apps/plugin-fs");
      const currentContent = await readTextFile(selectedFile.path);
      const currentCsv = parsePatientCsv(currentContent);
      const updatedContent = updatePatientCsv(currentContent, patient, currentCsv.lastUploaded);
      await writeTextFile(selectedFile.path, updatedContent);
      const csv = parsePatientCsv(updatedContent);
      const file = { name: selectedFile.name, path: selectedFile.path, content: updatedContent, csv };
      setFiles((currentFiles) => currentFiles.map((candidate) =>
        candidate.path === file.path ? file : candidate
      ));
      setActiveFile(file);

      const pending = csv.sessions.filter((session) => session.sessionNumber > csv.lastUploaded);
      setPendingSessions(pending);
      if (pending.length === 0) {
        setStatus(csv.sessions.length === 0
          ? "El archivo todavía no contiene mediciones."
          : "Todas las mediciones de este archivo ya fueron subidas.");
      } else {
        setStatus(`Se encontraron ${pending.length} sesiones pendientes. Revisa las mediciones antes de confirmar.`);
      }
    } catch (readError) {
      setError(readError.message);
    } finally {
      setIsBusy(false);
    }
  };

  const uploadPendingSessions = async () => {
    if (!activeFile || pendingSessions.length === 0) return;
    setError("");
    setStatus("");
    try {
      setIsBusy(true);
      const result = await importPatientSessions(patient.id, {
        filename: activeFile.name,
        sessions: pendingSessions,
      });
      const lastUploaded = Math.max(...pendingSessions.map((session) => session.sessionNumber));
      const updatedContent = updatePatientCsv(activeFile.content, patient, lastUploaded);

      try {
        const { writeTextFile } = await import("@tauri-apps/plugin-fs");
        await writeTextFile(activeFile.path, updatedContent);
      } catch (fileError) {
        throw new Error(
          `Los registros se guardaron, pero no se pudo actualizar la tarjeta SD. Vuelve a leer el archivo para sincronizarlo. ${fileError.message}`
        );
      }

      const csv = parsePatientCsv(updatedContent);
      const updatedFile = { ...activeFile, content: updatedContent, csv };
      setActiveFile(updatedFile);
      setFiles((currentFiles) => currentFiles.map((file) =>
        file.path === updatedFile.path ? updatedFile : file
      ));
      setPendingSessions([]);
      setStatus(`${result.imported_count} sesiones nuevas subidas.`);
      await onSaved();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsBusy(false);
    }
  };

  return <div className="col" style={{ gap: "1rem", justifyContent: "center", alignItems: "center", padding: "0 1.5rem" }}>
    {!directory && <p>Selecciona la carpeta de la tarjeta SD para buscar el CSV asociado a {patient.name}.</p>}
    {!activeFile &&
    <button className="btn" style={{width: "100%"}} type="button" onClick={loadDirectory} disabled={isBusy}>
      {isBusy ? "Procesando..." : directory ? "Cambiar carpeta SD" : "Seleccionar carpeta SD"}
    </button>
    }

    {directory && files.length > 0 && !activeFile && <div className="input-container full">
      <SelectInput
        style={{width: "100%"}}
        value={selectedPath}
        onChange={setSelectedPath}
        placeholder="Selecciona un archivo CSV"
        options={files.map((file) => ({
          value: file.path,
          label: `${file.name}${file.csv?.patientId
            ? ` (${file.csv.patientName || "Paciente sin nombre"})`
            : ""}`,
        }))}
        className=""
      />
      <label>Archivos CSV de la carpeta</label>
    </div>}

    {directory && files.length > 0 && !activeFile && <>
      <button className="btn" style={{width: "100%"}} type="button" onClick={readSelectedFile} disabled={isBusy || !selectedFile}>
        {selectedFileMatchesPatient ? "Leer registros disponibles" : "Asignar y leer archivo"}
      </button>
    </>}

    {directory && activeFile && <p style={{margin: "0"}}>Archivo seleccionado: {activeFile.name}</p>}
    {directory && !activeFile && !hasAssignedPatientFile && <button className="btn" style={{width:"100%"}} type="button" onClick={createPatientFile} disabled={isBusy}>
      Crear archivo para este paciente
    </button>}

    {status && <p role="status" style={{margin: "0"}}>{status}</p>}
    {error && <p role="alert">{error}</p>}

    {pendingSessions.length > 0 && <div className="col" style={{gap:"1em", width:"100%"}}>
      <h3>Sesiones pendientes</h3>
      {pendingSessions.map((session) => <div key={session.sessionNumber} style={{display: "flex", flexDirection:"row", padding:"0 1em"}}>
        <strong>Sesión {session.sessionNumber}</strong>
        <div style={{display: "flex", flexDirection:"row",gap:"1.5em", marginLeft:"auto"}}>
          {session.measurements.map((measurement) => (
            <span key={measurement.type}>
              {measurement.type === "REF" ? "Ref" : "Afe"}: {measurement.impedance}
            </span>
          ))}
        </div>
      </div>)}
      <button className="btn" type="button" onClick={uploadPendingSessions} disabled={isBusy}>
        {isBusy ? "Subiendo..." : `Confirmar y subir ${pendingSessions.length} sesiones`}
      </button>
    </div>}
  </div>;
}

export default PatientCsvImportForm;
