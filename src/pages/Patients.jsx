import { useEffect, useState } from "react";
import { LuSearch } from "react-icons/lu";
import SelectInput from "../components/SelectInput";
import PatientItem from "../components/PatientItem";
import { getPatients } from "../api";

function Patients(){
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const loadPatients = async (term = search) => {
    try {
      setError("");
      setPatients(await getPatients(term));
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  useEffect(() => { loadPatients(""); }, []);

  return(<>
  <div className="box">
    <h1>Pacientes</h1>
  </div>
  <div className="box toolbar" style={{display: 'flex', flexDirection: 'column', justifyContent: 'start', alignItems: 'start', gap: "1em"}}>

    <div style={{display: 'flex', justifyContent: 'start', alignItems: 'center', gap: "1em", width: "100%"}}>
      <input type="search" placeholder="Buscar paciente..." value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && loadPatients()} />
      <button className="btn" style={{alignSelf: 'stretch'}} onClick={() => loadPatients()}><LuSearch size={18} /></button>
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
    {error && <p role="alert">{error}</p>}
    {!error && patients.length === 0 && <p>No hay pacientes guardados.</p>}
    {patients.map((patient) => <PatientItem key={patient.id} patient={patient} />)}
    </div>  </>)
}

export default Patients;