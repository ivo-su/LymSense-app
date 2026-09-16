import { LuUser } from "react-icons/lu";
import SelectInput from "../components/SelectInput";

function Logs(){
  return (<>
    <div className="box" style={{display: 'flex', justifyContent: 'start', alignItems: 'center', gap: "1em"}}>
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
    <div style={{display:"flex", flexDirection:"column", gap:".5em"}}>
    {
      Array(5).fill(0).map((_, index) => 
        <div className="card" key={index}>
          <div className="user-icon">
            <LuUser size={24} />
          </div>
          <div style={{margin: "0 0 0 1em", display: 'flex', flexDirection: 'column', gap: "0.0em", justifyContent: 'center', alignItems: 'start'}}>
            <span>John Doe</span>
            <span style={{ fontSize: '0.9em', color: '#666' }}>2023-05-15</span>
          </div>
          <span>L-dex: 1.5</span>
          <span>Registro 5/5</span>
          <span>Guardado local</span>
        </div>
      )
    }
    </div>
  </>)
}

export default Logs;