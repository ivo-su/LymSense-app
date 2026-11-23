import { LuCirclePlus, LuList, LuTriangleAlert, LuUserPlus, LuUsers } from "react-icons/lu";
import { useEffect, useState } from "react";
import Modal from "../components/Modal";
import NewPatientForm from "../components/NewPatientForm";
import PatientCsvImportForm from "../components/PatientCsvImportForm";
import { Link, useNavigate } from "react-router";
import LogItem from "../components/LogItem";
import PatientItem from "../components/PatientItem";
import SelectInput from "../components/SelectInput";
import { getLogs, getPatients } from "../api";

const HOME_DASHBOARD_LIST_LIMIT = 8;

function Home() {
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isPatientOpen, setIsPatientOpen] = useState(false);
  const [patients, setPatients] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [nextPatients, setNextPatients] = useState([]);
  const [patientsError, setPatientsError] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([getPatients(), getLogs()])
      .then(([loadedPatients, loadedLogs]) => {
        setPatients(loadedPatients);
        setRecentLogs(loadedLogs.slice(0, HOME_DASHBOARD_LIST_LIMIT));

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
        }).slice(0, HOME_DASHBOARD_LIST_LIMIT));
      })
      .catch((error) => setPatientsError(error.message));
  }, []);

  const openLogModal = async () => {
    try {
      setPatientsError("");
      setPatients(await getPatients());
      setSelectedPatientId("");
      setIsLogOpen(true);
    } catch (error) {
      setPatientsError(error.message);
    }
  };

  return (
    <>
      <div className="box" style={{display: 'flex', justifyContent: 'start', alignItems: 'center', gap: "1em"}}>
        <h1>Bienvenido!</h1>
        {/* <span style={{ margin: "0 0 0 auto", fontSize: '0.9em', color: '#666', display: 'flex', alignItems: 'center', gap: "0.5em" }}><LuTriangleAlert size={20} /> El dispositivo está sin conexión</span> */}
      </div>
      <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', gap: "1em"}}>
        <button className="btn" onClick={openLogModal}><LuCirclePlus /> Cargar registros</button>
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
        title="Cargar registros"
        className="patient-create-modal"
        footer={<button className="btn" type="button" onClick={() => setIsLogOpen(false)}>Cerrar</button>}
      >
        <div className="col" style={{gap:"1em", width:"100%"}}>
          <div style={{padding:"0 1.5em"}}>
            <div className="input-container full">
              <SelectInput
                style={{width: "100%"}}
                value={selectedPatientId}
                onChange={setSelectedPatientId}
                placeholder="Selecciona un paciente"
                options={patients.map((patient) => ({
                  value: String(patient.id),
                  label: patient.name,
                }))}
                className=""
                disabled={patients.length === 0}
              />
              <label>Paciente</label>
            </div>
          </div>
          {patients.length === 0 && <p>No hay pacientes disponibles para asociar registros.</p>}
          {selectedPatientId && <PatientCsvImportForm
            key={selectedPatientId}
            patient={patients.find((patient) => patient.id === Number(selectedPatientId))}
            onSaved={async () => {
              setRecentLogs((await getLogs()).slice(0, HOME_DASHBOARD_LIST_LIMIT));
            }}
          />}
        </div>
        {patientsError && <p role="alert">{patientsError}</p>}
      </Modal>

      <Modal isOpen={isPatientOpen}
        onClose={() => setIsPatientOpen(false)}
        title="Nuevo paciente"
        className="patient-create-modal"
        size="xl"
      >
        <NewPatientForm onSaved={(newPatientId) => navigate(`/patients/${newPatientId}`)}/>
      </Modal>
    </>
  );
}

export default Home;