import { LuAlignEndHorizontal, LuArrowDownToLine, LuChartLine, LuCirclePlus, LuFileCheck, LuHash, LuHistory, LuList, LuTriangleAlert, LuUser, LuUserPlus, LuUsers } from "react-icons/lu";
import { useState } from "react";
import Modal from "../components/Modal";
import { Link, useNavigate } from "react-router";
import LogItem from "../components/LogItem";
import PatientItem from "../components/PatientItem";
import { createPatient } from "../api";

function NewPatientForm({ onSaved }){
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      await createPatient(Object.fromEntries(formData.entries()));
      form.reset();
      onSaved();
      navigate("/patients");
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  return <form className="col" onSubmit={handleSubmit} id="new-patient-form">
    <div className="input-container">
      <input type="text" name='name' placeholder="" required/>
      <label htmlFor="">Nombre completo</label>
    </div>
    {error && <p role="alert">{error}</p>}
  </form>
}

function Home() {
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isPatientOpen, setIsPatientOpen] = useState(false);

  return (
    <>
      <div className="box" style={{display: 'flex', justifyContent: 'start', alignItems: 'center', gap: "1em"}}>
        <h1>Bienvenido!</h1>
        <span style={{ margin: "0 0 0 auto", fontSize: '0.9em', color: '#666', display: 'flex', alignItems: 'center', gap: "0.5em" }}><LuTriangleAlert size={20} /> El dispositivo está offline</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', gap: "1em"}}>
        <button className="btn" onClick={() => setIsLogOpen(true)}><LuCirclePlus /> Nuevo registro</button>
        <Link to="/logs" className="btn"><LuList />Ver registros</Link>
        <button className="btn" onClick={()=> setIsPatientOpen(true)}><LuUserPlus /> Nuevo paciente</button>
        <Link to="/patients" className="btn"><LuUsers />Ver pacientes</Link>
      </div>

      <div style={{display: 'flex', flexDirection:'row', justifyContent: 'space-between', alignItems: 'stretch', gap: "1em", marginTop: "1em"}}>
        <div style={{display: 'flex', flexDirection:'column', justifyContent: 'start', alignItems: 'stretch', gap: "1em", flex: 1}}>
          <h3>Últimos registros</h3>
          <div className="box log-list">
            {Array(5).fill(0).map((_, index) =>
              <LogItem key={index} />
              )}
          </div>
        </div>
        <div style={{display: 'flex', flexDirection:'column', justifyContent: 'start', alignItems: 'stretch', gap: "1em", flex: 1}}>
          <h3 style={{ textAlign: 'start'}}>Próximos pacientes</h3>
          <div className="box log-list">
            <PatientItem/>
          </div>
        </div>
        
      </div>
      

      <Modal isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        title="Modal de ejemplo"
        footer={<button className="btn" onClick={() => console.log("Acción del modal")}>Acción</button>}
      >
        <p>Este es un modal de ejemplo.</p>
      </Modal>

      <Modal isOpen={isPatientOpen}
        onClose={() => setIsPatientOpen(false)}
        title="Nuevo paciente"
        footer={<button className="btn" type="submit" form="new-patient-form">Guardar</button>}
      >
        <NewPatientForm onSaved={() => setIsPatientOpen(false)}/>
      </Modal>
    </>
  );
}

export default Home;