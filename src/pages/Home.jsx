import { LuAlignEndHorizontal, LuArrowDownToLine, LuChartLine, LuCirclePlus, LuFileCheck, LuHash, LuHistory, LuList, LuTriangleAlert, LuUser, LuUserPlus, LuUsers } from "react-icons/lu";
import { getPatients } from "../dev/getFakeData";
import { useEffect, useState } from "react";
import Modal from "../components/Modal";
import { Link } from "react-router";
import LogItem from "../components/LogItem";
import PatientItem from "../components/PatientItem";

function NewPatientForm(){
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData.entries())
    console.log(data)
  }

  return <form className="col" onSubmit={handleSubmit} id="new-patient-form">
    <div className="input-container">
      <input type="text" name='name' placeholder="" required/>
      <label htmlFor="">Nombre completo</label>
    </div>
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
        footer={<button className="btn" form="new-patient-form" onClick={() => console.log("Acción del modal")}>Guardar</button>}
      >
        <NewPatientForm/>
      </Modal>
    </>
  );
}

export default Home;