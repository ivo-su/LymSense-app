import { LuSearch, LuUser } from "react-icons/lu";
import SelectInput from "../components/SelectInput";
import { Link } from "react-router";
import PatientItem from "../components/PatientItem";

function Patients(){
  return(<>
  <div className="box">
    <h1>Pacientes</h1>
  </div>
  <div className="box toolbar" style={{display: 'flex', flexDirection: 'column', justifyContent: 'start', alignItems: 'start', gap: "1em"}}>

    <div style={{display: 'flex', justifyContent: 'start', alignItems: 'center', gap: "1em", width: "100%"}}>
      <input type="text" placeholder="Buscar paciente..." />
      <button className="btn" style={{alignSelf: 'stretch'}}><LuSearch size={18} /></button>
      <span style={{margin:"0 0 0 auto"}}>Ordenar por:</span>
      <div style={{width: "200px"}}>
        <SelectInput options={[
          { value: 'name-asc', label: 'Nombre (A-Z)' },
          { value: 'name-desc', label: 'Nombre (Z-A)' },
          { value: 'date', label: 'Fecha' },
        ]} defaultValue="name-asc" />
      </div>
    </div>
  </div>
    <div className="box log-list">
    {
      Array(5).fill(0).map((_, index) => 
        <PatientItem/>
      )
    }
    </div>  </>)
}

export default Patients;