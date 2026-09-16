import { LuChartLine, LuHash, LuHistory, LuTrash2, LuUser } from "react-icons/lu"
import { Link } from "react-router"

function PatientItem({ patient, onDelete }){
  const patientId = patient?.id ?? 1;
  const patientName = patient?.name ?? "John Doe";

  return <>

    <div className="log-list-item">
      <div className="circle-icon user">
        <LuUser size={24} />
      </div>
      <div style={{margin: "0 0 0 1em", display: 'flex', flexDirection: 'column', gap: "0.0em", justifyContent: 'center', alignItems: 'start'}}>
        <Link to={`/patients/${patientId}`} style={{fontWeight: '500'}}>{patientName}</Link>
      </div>
      <div style={{ margin: "0 0 0 auto", display: 'flex', flexDirection: 'row', gap: ".5em", justifyContent: 'center', alignItems: 'center'}}>
        <div className="icon-container">
          <LuChartLine size={18} /> 
        </div> 
        1.5
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', gap: ".5em", justifyContent: 'center', alignItems: 'center'}}>
        <div className="icon-container">
          <LuHash size={18} /> 
        </div> 
        5 / 5
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', gap: ".5em", justifyContent: 'center', alignItems: 'center'}}>
        <div className="icon-container">
          <LuHistory size={18} /> 
        </div> 
        2 meses
      </div>
      {onDelete && <button
        type="button"
        className=""
        style={{padding: "0.25em", color:"red", background:"none", border:'none', margin:"0 0 0 1em"}}
        onClick={() => onDelete(patient)}
        aria-label={`Eliminar a ${patientName}`}
        title={`Eliminar a ${patientName}`}
      >
        <LuTrash2 size={18} />
      </button>}
    </div>
  </>
}

export default PatientItem