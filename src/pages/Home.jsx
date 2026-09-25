import { LuCirclePlus, LuList, LuTriangleAlert, LuUserPlus, LuUsers } from "react-icons/lu";
import { useEffect, useState } from "react";
import Modal from "../components/Modal";
import { Link, useNavigate } from "react-router";
import LogItem from "../components/LogItem";
import PatientItem from "../components/PatientItem";
import SelectInput from "../components/SelectInput";
import { createLog, createPatient, getLogs, getPatients } from "../api";

function NewLogForm({ patients, onSaved, onPatientsReload }) {
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const file = form.elements.file.files[0];
    const patientId = form.elements.patient_id.value;
    const healthyInput = form.elements.z_healthy.value.trim();
    const riskInput = form.elements.z_risk.value.trim();

    if (!patientId) {
      setError("Selecciona el paciente al que pertenece el registro.");
      return;
    }

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
      const availablePatients = await onPatientsReload();
      if (!availablePatients.some((patient) => patient.id === Number(patientId))) {
        throw new Error("El paciente seleccionado ya no existe. Selecciona otro paciente.");
      }

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
      onSaved(patientId);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSaving(false);
    }
  };

  return <form className="col" onSubmit={handleSubmit} id="new-log-form">
    <div className="input-container">
      <SelectInput
        name="patient_id"
        defaultValue=""
        placeholder="Selecciona un paciente"
        options={patients.map((patient) => ({
          value: String(patient.id),
          label: patient.name,
        }))}
        className=""
      />
      <label htmlFor="patient_id">Paciente</label>
    </div>
    <div className="input-container">
      <input type="file" name="file" accept=".json,application/json" id="file"/>
      <label htmlFor="file">Archivo del dispositivo</label>
    </div>
    <div className="input-container">
      <input type="text" name="z_healthy" placeholder=" " inputMode="decimal" id="z_healthy"/>
      <label htmlFor="z_healthy">z_healthy (manual)</label>
    </div>
    <div className="input-container">
      <input type="text" name="z_risk" placeholder=" " inputMode="decimal" id="z_risk"/>
      <label htmlFor="z_risk">z_risk (manual)</label>
    </div>
    {patients.length === 0 && <p>No hay pacientes disponibles para asociar el registro.</p>}
    {error && <p role="alert">{error}</p>}
    {isSaving && <p>Guardando registro...</p>}
  </form>;
}

function NewPatientForm({ onSaved }){
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const newPatient = await createPatient(Object.fromEntries(formData.entries()));
      form.reset();
      onSaved(newPatient.id);
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  return <form className="col" onSubmit={handleSubmit} id="new-patient-form">
    <div className="input-container">
      <input type="text" name='name' placeholder="" id="new-patient-name" required/>
      <label htmlFor="new-patient-name">Nombre completo</label>
    </div>
    {error && <p role="alert">{error}</p>}
  </form>
}

function Home() {
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isPatientOpen, setIsPatientOpen] = useState(false);
  const [patients, setPatients] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [nextPatients, setNextPatients] = useState([]);
  const [patientsError, setPatientsError] = useState("");
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([getPatients(), getLogs()])
      .then(([loadedPatients, loadedLogs]) => {
        setPatients(loadedPatients);
        setRecentLogs(loadedLogs.slice(0, 5));

        const latestLogByPatient = new Map();
        loadedLogs.forEach((log) => {
          const currentLatest = latestLogByPatient.get(log.patient_id);
          if (!currentLatest || new Date(log.imported_at) > new Date(currentLatest)) {
            latestLogByPatient.set(log.patient_id, log.imported_at);
          }
        });

        setNextPatients([...loadedPatients].sort((firstPatient, secondPatient) => {
          const firstLatest = latestLogByPatient.get(firstPatient.id);
          const secondLatest = latestLogByPatient.get(secondPatient.id);
          if (!firstLatest && !secondLatest) return 0;
          if (!firstLatest) return -1;
          if (!secondLatest) return 1;
          return new Date(firstLatest) - new Date(secondLatest);
        }).slice(0, 5));
      })
      .catch((error) => setPatientsError(error.message));
  }, []);

  const openLogModal = async () => {
    try {
      setPatientsError("");
      setPatients(await getPatients());
      setIsLogOpen(true);
    } catch (error) {
      setPatientsError(error.message);
    }
  };

  return (
    <>
      <div className="box" style={{display: 'flex', justifyContent: 'start', alignItems: 'center', gap: "1em"}}>
        <h1>Bienvenido!</h1>
        <span style={{ margin: "0 0 0 auto", fontSize: '0.9em', color: '#666', display: 'flex', alignItems: 'center', gap: "0.5em" }}><LuTriangleAlert size={20} /> El dispositivo está offline</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', gap: "1em"}}>
        <button className="btn" onClick={openLogModal}><LuCirclePlus /> Nuevo registro</button>
        <Link to="/logs" className="btn"><LuList />Ver registros</Link>
        <button className="btn" onClick={()=> setIsPatientOpen(true)}><LuUserPlus /> Nuevo paciente</button>
        <Link to="/patients" className="btn"><LuUsers />Ver pacientes</Link>
      </div>

      <div style={{display: 'flex', flexDirection:'row', justifyContent: 'space-between', alignItems: 'stretch', gap: "1em", marginTop: "1em"}}>
        <div style={{display: 'flex', flexDirection:'column', justifyContent: 'start', alignItems: 'stretch', gap: "1em", flex: 1}}>
          <h3>Últimos registros</h3>
          <div className="box log-list">
            {!patientsError && recentLogs.length === 0 && <p>No hay registros guardados.</p>}
            {recentLogs.slice(0, 5).map((log) => <LogItem key={log.id} log={log} />)}
          </div>
        </div>
        <div style={{display: 'flex', flexDirection:'column', justifyContent: 'start', alignItems: 'stretch', gap: "1em", flex: 1}}>
          <h3 style={{ textAlign: 'start'}}>Próximos pacientes</h3>
          <div className="box log-list">
            {!patientsError && nextPatients.length === 0 && <p>No hay pacientes guardados.</p>}
            {nextPatients.slice(0, 5).map((patient) => <PatientItem key={patient.id} patient={patient} />)}
          </div>
        </div>
        
      </div>
      

      <Modal isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        title="Nuevo registro"
        footer={<button className="btn" type="submit" form="new-log-form" disabled={patients.length === 0}>Guardar</button>}
      >
        <NewLogForm
          patients={patients}
          onSaved={(patientId) => navigate(`/patients/${patientId}`)}
          onPatientsReload={async () => {
            const refreshedPatients = await getPatients();
            setPatients(refreshedPatients);
            return refreshedPatients;
          }}
        />
        {patientsError && <p role="alert">{patientsError}</p>}
      </Modal>

      <Modal isOpen={isPatientOpen}
        onClose={() => setIsPatientOpen(false)}
        title="Nuevo paciente"
        footer={<button className="btn" type="submit" form="new-patient-form">Guardar</button>}
      >
        <NewPatientForm onSaved={(newPatientId) => navigate(`/patients/${newPatientId}`)}/>
      </Modal>
    </>
  );
}

export default Home;