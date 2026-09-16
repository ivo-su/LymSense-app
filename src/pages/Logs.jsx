import { useEffect, useState } from "react";
import SelectInput from "../components/SelectInput";
import LogItem from "../components/LogItem";
import Modal from "../components/Modal";
import { deleteLog, getLogs } from "../api";

function Logs(){
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [logToDelete, setLogToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    getLogs().then(setLogs).catch((loadError) => setError(loadError.message));
  }, []);

  const handleDelete = async () => {
    if (!logToDelete) return;

    try {
      setIsDeleting(true);
      setError("");
      await deleteLog(logToDelete.id);
      setLogs((currentLogs) => currentLogs.filter((log) => log.id !== logToDelete.id));
      setLogToDelete(null);
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (<>
    <div className="box toolbar" style={{display: 'flex', justifyContent: 'start', alignItems: 'center', gap: "1em"}}>
      <h1>Registros</h1>
      <span style={{margin:"0 0 0 auto"}}>Ordenar por:</span>
      <div style={{width: "150px"}}>
        <SelectInput options={[
          { value: 'date', label: 'Fecha' },
          { value: 'patient', label: 'Paciente' },
          { value: 'ldex', label: 'L-dex' }
        ]} defaultValue="date" />
      </div>
    </div>
    <div className='box log-list'>
    {error && <p role="alert">{error}</p>}
    {!error && logs.length === 0 && <p>No hay registros guardados.</p>}
    {logs.map((log) => <LogItem key={log.id} log={log} onDelete={setLogToDelete} />)}
    </div>
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
      <p>¿Seguro que quieres eliminar el registro de {logToDelete?.patient_name}?</p>
    </Modal>
  </>)
}

export default Logs;