import { LuChartLine, LuHash, LuHistory, LuUser } from "react-icons/lu"
import { Link } from "react-router"

function PatientItem(){
  return <>

      <div className="log-list-item">
      <div className="circle-icon user">
        <LuUser size={24} />
      </div>
      <div style={{margin: "0 0 0 1em", display: 'flex', flexDirection: 'column', gap: "0.0em", justifyContent: 'center', alignItems: 'start'}}>
        <Link to="/patients/1" style={{fontWeight: '500'}}>John Doe</Link>
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
    </div>
  </>
}

export default PatientItem