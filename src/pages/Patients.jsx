import { useEffect, useState } from "react";
import { LuCirclePlus, LuSearch } from "react-icons/lu";
import SelectInput from "../components/SelectInput";
import PatientItem from "../components/PatientItem";
import Modal from "../components/Modal";
import { createPatient, deletePatient, getPatients } from "../api";

function NewPatientForm({ onSaved }) {
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      await createPatient(Object.fromEntries(formData.entries()));
      form.reset();
      onSaved();
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return <form className="col" onSubmit={handleSubmit} id="new-patient-form">
    <div className="input-container">
      <input type="text" name="name" placeholder="" required />
      <label htmlFor="name">Nombre completo</label>
    </div>
    {error && <p role="alert">{error}</p>}
  </form>;
}

function Patients(){
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPatientOpen, setIsPatientOpen] = useState(false);

  const loadPatients = async (term = search) => {
    try {
      setError("");
      setPatients(await getPatients(term));
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  useEffect(() => { loadPatients(""); }, []);

  const handleDelete = async () => {
    if (!patientToDelete) return;

    try {
      setIsDeleting(true);
      setError("");
      await deletePatient(patientToDelete.id);
      setPatients((currentPatients) => currentPatients.filter(
        (patient) => patient.id !== patientToDelete.id
      ));
      setPatientToDelete(null);
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return(<>
  <div className="box" style={{ display: "flex", justifyContent:"space-between", alignItems: "center", gap: "1em" }}>
    <h1>Pacientes</h1>
    <button className="btn" style={{background:"none", border:"none", padding:"0", boxShadow:"none"}} type="button" onClick={() => setIsPatientOpen(true)}>
      <LuCirclePlus /> Nuevo paciente
    </button>
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
    {patients.map((patient) => <PatientItem
      key={patient.id}
      patient={patient}
      onDelete={setPatientToDelete}
    />)}
    </div>
    <Modal
      isOpen={Boolean(patientToDelete)}
      onClose={() => !isDeleting && setPatientToDelete(null)}
      title="Eliminar paciente"
      footer={<>
        <button
          type="button"
          className="btn"
          onClick={() => setPatientToDelete(null)}
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
      <p>¿Seguro que quieres eliminar a {patientToDelete?.name}?</p>
    </Modal>
    <Modal
      isOpen={isPatientOpen}
      onClose={() => setIsPatientOpen(false)}
      title="Nuevo paciente"
      footer={<button className="btn" type="submit" form="new-patient-form">Guardar</button>}
    >
      <NewPatientForm
        onSaved={async () => {
          await loadPatients();
          setIsPatientOpen(false);
        }}
      />
    </Modal>
  </> )
}

export default Patients;