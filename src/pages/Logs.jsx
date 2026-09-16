import { LuUser } from "react-icons/lu";
import SelectInput from "../components/SelectInput";
import LogItem from "../components/LogItem";

function Logs(){
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
    {
      Array(5).fill(0).map((_, index) => 
        <LogItem/>
      )
    }
    </div>
  </>)
}

export default Logs;