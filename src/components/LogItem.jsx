import { LuArrowDownToLine, LuChartLine, LuFileCheck, LuHash } from "react-icons/lu";
import { Link } from "react-router";

function LogItem(){
  return <>
    <div className="log-list-item">
      <div className="circle-icon log">
        <LuFileCheck size={24} />
      </div>
      <div style={{margin: "0 0 0 .5em", display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'start'}}>
        <Link to="/patients/1" style={{fontWeight: '500'}}>John Doe</Link>
        <span style={{ fontSize: '0.9em', color: '#666' }}>2023-05-15</span>
      </div>
      <div style={{ margin: "0 0 0 auto", display: 'flex', flexDirection: 'row', gap: ".25em", justifyContent: 'center', alignItems: 'center'}}>
        <div className="icon-container">
          <LuChartLine size={18} /> 
        </div> 
        1.5
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', gap: ".25em", justifyContent: 'center', alignItems: 'center'}}>
        <div className="icon-container">
          <LuHash size={18} /> 
        </div> 
        5 / 5
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', gap: ".25em", justifyContent: 'center', alignItems: 'center'}}>
        <div className="icon-container">
          <LuArrowDownToLine size={18} /> 
        </div> 
        Local
      </div>  
    </div>
  </>
}

export default LogItem;