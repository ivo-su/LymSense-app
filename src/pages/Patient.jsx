import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import LineGraph from '../components/LineGraph';
import LogItem from '../components/LogItem';
import Modal from '../components/Modal';
import BackButton from '../components/BackButton';
import { createLog, deleteLog, getPatient, setLogReference } from '../api';
import { LuCirclePlus } from 'react-icons/lu';

function NewLogForm({ patientId, onSaved }) {
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const file = form.elements.file.files[0];
    const healthyInput = form.elements.z_healthy.value.trim();
    const riskInput = form.elements.z_risk.value.trim();

    if (!file && (!healthyInput || !riskInput)) {
      setError("Selecciona un archivo o completa z_healthy y z_risk.");
      return;
    }

    if ((healthyInput && !riskInput) || (!healthyInput && riskInput)) {
      setError("Completa ambas mediciones manuales.");
      return;
    }

    try {
      setIsSaving(true);
      let zHealthy;
      let zRisk;
      let filename = "manual-entry.json";

      if (healthyInput && riskInput) {
        zHealthy = Number(healthyInput.replace(",", "."));
        zRisk = Number(riskInput.replace(",", "."));
      } else {
        let parsedContent;
        try {
          parsedContent = JSON.parse(await file.text());
        } catch {
          throw new Error("El archivo no contiene un documento JSON válido.");
        }
        zHealthy = Number(parsedContent?.z_healthy);
        zRisk = Number(String(parsedContent?.z_risk ?? "").replace(",", "."));
        filename = file.name;
      }
      if (!Number.isFinite(zHealthy) || !Number.isFinite(zRisk)) {
        throw new Error("El archivo debe contener z_healthy y z_risk numéricos.");
      }
      if (zRisk === 0) {
        throw new Error("La medición z_risk no puede ser cero.");
      }

      await createLog({
        patient_id: Number(patientId),
        filename,
        z_healthy: zHealthy,
        z_risk: zRisk,
      });
      form.reset();
      await onSaved();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSaving(false);
    }
  };

  return <form className="col" onSubmit={handleSubmit} id="patient-new-log-form">
    <div className="input-container">
      <input type="file" name="file" accept=".json,application/json" />
      <label htmlFor="file">Archivo del dispositivo</label>
    </div>
    <div className="input-container">
      <input type="text" name="z_healthy" placeholder=" " inputMode="decimal" id='z_healthy'/>
      <label htmlFor="z_healthy">z_healthy (manual)</label>
    </div>
    <div className="input-container">
      <input type="text" name="z_risk" placeholder=" " inputMode="decimal" id='z_risk'/>
      <label htmlFor="z_risk">z_risk (manual)</label>
    </div>
    {error && <p role="alert">{error}</p>}
    {isSaving && <p>Guardando registro...</p>}
  </form>;
}

function Patient(){
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState("");
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleReference = async (log) => {
    try {
      await setLogReference(log.id);
      setPatient(await getPatient(id));
    } catch (referenceError) {
      setError(referenceError.message);
    }
  };

  const handleDelete = async () => {
    if (!logToDelete) return;

    try {
      setIsDeleting(true);
      await deleteLog(logToDelete.id);
      setPatient(await getPatient(id));
      setLogToDelete(null);
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    getPatient(id).then(setPatient).catch((loadError) => setError(loadError.message));
  }, [id]);

  if (error) return <p role="alert">{error}</p>;
  if (!patient) return <p>Cargando paciente...</p>;

  const latestLog = patient.logs.at(-1);
  const referenceLog = patient.logs.find((log) => log.reference);

  return (<>
    <div className="box" style={{ display: "flex", justifyContent:"start", alignItems: "center", gap: "1em" }}>
    <BackButton />
    <h1>Historial de {patient.name}</h1>
    <button className="btn" style={{background:"none", border:"none", padding:"0", boxShadow:"none", marginLeft:"auto"}} type="button" onClick={() => setIsLogOpen(true)}>
      <LuCirclePlus /> Nuevo registro
    </button>
  </div>

    <div className="patient-overview">


    <div className='box patient-info'>
      <h3>Información</h3>
      <span>Nombre: {patient.name}</span>
      <span>Registros: {patient.logs.length}</span>
      <span>Último registro: {latestLog ? new Date(latestLog.imported_at).toLocaleDateString() : 'Sin registros'}</span>
    </div>
    <div className="box" style={{flex: 1}}>
      <h3>Gráfico de L-ratio</h3>
      <div className="graph-container">
        <LineGraph logs={patient.logs} referenceLog={referenceLog} />
      </div>
    </div>
    </div>
    <div className="box log-list" >
      {patient.logs.length === 0 && <p>No hay registros para este paciente.</p>}
      {/* {!referenceLog && patient.logs.length > 0 && <p>Marca un registro con z_risk como referencia para ver la segunda serie.</p>} */}
      {patient.logs.map((log) => <LogItem
        key={log.id}
        log={{ ...log, patient_name: patient.name }}
        onDelete={setLogToDelete}
        onReference={handleReference}
      />)}
    </div>

    <Modal
      isOpen={isLogOpen}
      onClose={() => setIsLogOpen(false)}
      title={`Nuevo registro para ${patient.name}`}
      footer={<button className="btn" type="submit" form="patient-new-log-form">Guardar</button>}
    >
      <NewLogForm
        patientId={id}
        onSaved={async () => {
          setPatient(await getPatient(id));
          setIsLogOpen(false);
        }}
      />
    </Modal>

    <Modal
      isOpen={Boolean(logToDelete)}
      onClose={() => !isDeleting && setLogToDelete(null)}
      title="Eliminar registro"
      footer={<>
        <button
          type="button"
          className="btn"
          onClick={() => setLogToDelete(null)}
          disabled={isDeleting}
        >Cancelar</button>
        <button
          type="button"
          className="btn"
          onClick={handleDelete}
          disabled={isDeleting}
        >{isDeleting ? "Eliminando..." : "Eliminar"}</button>
      </>}
    >
      <p>¿Seguro que quieres eliminar este registro?</p>
    </Modal>

  </>)
}

export default Patient;