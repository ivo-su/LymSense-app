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

    if (!patientId) {
      setError("Selecciona el paciente al que pertenece el registro.");
      return;
    }

    if (!file) {
      setError("Selecciona el archivo generado por el dispositivo.");
      return;
    }

    try {
      setIsSaving(true);
      const availablePatients = await onPatientsReload();
      if (!availablePatients.some((patient) => patient.id === Number(patientId))) {
        throw new Error("El paciente seleccionado ya no existe. Selecciona otro paciente.");
      }

      const rawContent = await file.text();
      let parsedContent;

      try {
        parsedContent = JSON.parse(rawContent);
      } catch {
        throw new Error("El archivo no contiene un documento JSON válido.");
      }

      const lDex = parsedContent?.lDex;
      if (typeof lDex !== "number" || !Number.isFinite(lDex)) {
        throw new Error("El archivo debe contener un valor numérico lDex.");
      }

      await createLog({
        patient_id: Number(patientId),
        filename: file.name,
        ldex: lDex,
      });
      
      form.reset();
      onSaved();
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
      <input type="file" name="file" accept=".json,application/json" required />
      <label htmlFor="file">Archivo del dispositivo</label>
    </div>
    {patients.length === 0 && <p>No hay pacientes disponibles para asociar el registro.</p>}
    {error && <p role="alert">{error}</p>}
    {isSaving && <p>Guardando registro...</p>}
  </form>;
}

function NewPatientForm({ onSaved }){
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      await createPatient(Object.fromEntries(formData.entries()));
      form.reset();
      onSaved();
      navigate("/patients");
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  return <form className="col" onSubmit={handleSubmit} id="new-patient-form">
    <div className="input-container">
      <input type="text" name='name' placeholder="" required/>
      <label htmlFor="">Nombre completo</label>
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
            {recentLogs.map((log) => <LogItem key={log.id} log={log} />)}
          </div>
        </div>
        <div style={{display: 'flex', flexDirection:'column', justifyContent: 'start', alignItems: 'stretch', gap: "1em", flex: 1}}>
          <h3 style={{ textAlign: 'start'}}>Próximos pacientes</h3>
          <div className="box log-list">
            {!patientsError && nextPatients.length === 0 && <p>No hay pacientes guardados.</p>}
            {nextPatients.map((patient) => <PatientItem key={patient.id} patient={patient} />)}
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
          onSaved={() => setIsLogOpen(false)}
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
        <NewPatientForm onSaved={() => setIsPatientOpen(false)}/>
      </Modal>
    </>
  );
}

export default Home;