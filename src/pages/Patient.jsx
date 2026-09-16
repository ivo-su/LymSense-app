import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import LineGraph from '../components/LineGraph';
import LogItem from '../components/LogItem';
import { getPatient } from '../api';

function Patient(){
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getPatient(id).then(setPatient).catch((loadError) => setError(loadError.message));
  }, [id]);

  if (error) return <p role="alert">{error}</p>;
  if (!patient) return <p>Cargando paciente...</p>;

  const latestLog = patient.logs.at(-1);

  return (<>
  <div className="box">
    <h1>Historial de {patient.name}</h1>
  </div>

    <div className="patient-overview">


    <div className='box patient-info'>
      <h3>Información</h3>
      <span>Nombre: {patient.name}</span>
      <span>Registros: {patient.logs.length}</span>
      <span>Último registro: {latestLog ? new Date(latestLog.imported_at).toLocaleDateString() : 'Sin registros'}</span>
    </div>
    <div className="box" style={{flex: 1}}>
      <h3>Gráfico de L-dex</h3>
      <div className="graph-container">
        <LineGraph logs={patient.logs} />
      </div>
    </div>
    </div>
    <div className="box log-list" >
        {patient.logs.length === 0 && <p>No hay registros para este paciente.</p>}
        {patient.logs.map((log) => <LogItem key={log.id} log={{ ...log, patient_name: patient.name }} />)}
        </div>

  </>)
}

export default Patient;