import { LuChartLine, LuFileCheck, LuHash, LuStar, LuTrash2 } from "react-icons/lu";
import { Link } from "react-router";

function formatLdex(value) {
  return value == null || !Number.isFinite(Number(value)) ? "-" : Number(value).toFixed(2);
}

function LogItem({ log, onDelete, onReference }){
  const patientId = log?.patient_id ?? 1;
  const patientName = log?.patient_name ?? "Paciente desconocido";
  const importedDate = log?.imported_at
    ? new Date(log.imported_at).toLocaleDateString()
    : "Sin fecha";

  return <>
    <div className="log-list-item">
      <div className="circle-icon log">
        <LuFileCheck size={24} />
      </div>
      <div style={{margin: "0 0 0 .5em", display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'start'}}>
        <Link to={`/patients/${patientId}`} style={{fontWeight: '500'}}>{patientName}</Link>
        <span style={{ fontSize: '0.9em', color: '#666' }}>{importedDate}</span>
      </div>
      <div style={{ margin: "0 0 0 auto", display: 'flex', flexDirection: 'row', gap: ".25em", justifyContent: 'center', alignItems: 'center'}}>
        <div className="icon-container">
          <LuChartLine size={18} /> 
        </div> 
        {formatLdex(log?.ldex)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', gap: ".25em", justifyContent: 'center', alignItems: 'center'}}>
        <div className="icon-container">
          <LuHash size={18} /> 
        </div> 
        {log ? `${log.log_number} / ${log.total_logs}` : "-"}
      </div>
      {onDelete && <button
        type="button"
        className=""
        style={{padding: "0.25em", color:"red", background:"none", border:'none', margin:"0 0 0 1em"}}
        onClick={() => onDelete(log)}
        aria-label={`Eliminar registro de ${patientName}`}
        title={`Eliminar registro de ${patientName}`}
      >
        <LuTrash2 size={18} />
      </button>}
      {onReference && <button
        type="button"
        className=""
        style={{padding: "0.25em", color: log?.reference ? "#d97706" : "#6b7280", background:"none", border:'none', margin:"0 0 0 0.25em"}}
        onClick={() => onReference(log)}
        aria-label={log?.reference ? "Registro de referencia" : "Marcar como referencia"}
        title={log?.reference ? "Registro de referencia" : "Marcar como referencia"}
      >
        <LuStar size={18} fill={log?.reference ? "currentColor" : "none"} />
      </button>}
    </div>
  </>
}

export default LogItem;