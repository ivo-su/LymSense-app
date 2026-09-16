import { LuSearch, LuUser } from "react-icons/lu";
import SelectInput from "../components/SelectInput";
import { Link } from "react-router";

function Patients(){
  return(<>
  <div className="box" style={{display: 'flex', flexDirection: 'column', justifyContent: 'start', alignItems: 'start', gap: "1em"}}>

    <h1>Pacientes</h1>
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
    <div className="grid-2">
    {
      Array(5).fill(0).map((_, index) => 
        <div className="card" key={index}>
          <div className="user-icon">
            <LuUser size={24} />
          </div>
            <Link to={`/patients/1`}><span>John Doe</span></Link>
            <span>Registros: 5</span>
            <span style={{ fontSize: '0.9em', color: '#666' }}>2023-05-15</span>
        </div>
      )
    }
    </div>  </>)
}

export default Patients;