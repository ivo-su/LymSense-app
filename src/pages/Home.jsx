import { LuCirclePlus, LuList, LuTriangleAlert, LuUser, LuUserPlus, LuUsers } from "react-icons/lu";
import { getPatients } from "../dev/getFakeData";
import { useEffect, useState } from "react";
import Modal from "../components/Modal";
import { Link } from "react-router";

function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

useEffect(() => {
  getPatients()
}, [])


  return (
    <>
      <div style={{display: 'flex', justifyContent: 'start', alignItems: 'center', gap: "1em"}}>
        <h1 style={{ textAlign: 'start'}}>Bienvenido!</h1>
        <span style={{ margin: "0 0 0 auto", fontSize: '0.9em', color: '#666', display: 'flex', alignItems: 'center', gap: "0.5em" }}><LuTriangleAlert size={20} /> El dispositivo está offline</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', gap: "1em"}}>
        <button className="btn" onClick={() => setIsModalOpen(true)}><LuCirclePlus /> Nuevo registro</button>
        <Link to="/logs" className="btn"><LuList />Ver registros</Link>
        <button className="btn"><LuUserPlus /> Nuevo paciente</button>
        <Link to="/patients" className="btn"><LuUsers />Ver pacientes</Link>
      </div>

      <h3 style={{ textAlign: 'start'}}>Último registro</h3>
      <div className="card">
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

      <Modal isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Modal de ejemplo"
        footer={<button className="btn" onClick={() => console.log("Acción del modal")}>Acción</button>}
      >
        <p>Este es un modal de ejemplo.</p>
      </Modal>
    </>
  );
}

export default Home;