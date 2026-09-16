import { LuAlignEndHorizontal, LuArrowDownToLine, LuChartLine, LuCirclePlus, LuHash, LuHistory, LuList, LuTriangleAlert, LuUser, LuUserPlus, LuUsers } from "react-icons/lu";
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
      <div className="box" style={{display: 'flex', justifyContent: 'start', alignItems: 'center', gap: "1em"}}>
        <h1 style={{ textAlign: 'start'}}>Bienvenido!</h1>
        <span style={{ margin: "0 0 0 auto", fontSize: '0.9em', color: '#666', display: 'flex', alignItems: 'center', gap: "0.5em" }}><LuTriangleAlert size={20} /> El dispositivo está offline</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', gap: "1em"}}>
        <button className="btn" onClick={() => setIsModalOpen(true)}><LuCirclePlus /> Nuevo registro</button>
        <Link to="/logs" className="btn"><LuList />Ver registros</Link>
        <button className="btn"><LuUserPlus /> Nuevo paciente</button>
        <Link to="/patients" className="btn"><LuUsers />Ver pacientes</Link>
      </div>

      <div style={{display: 'flex', flexDirection:'row', justifyContent: 'space-between', alignItems: 'stretch', gap: "1em", marginTop: "1em"}}>
        <div style={{display: 'flex', flexDirection:'column', justifyContent: 'start', alignItems: 'stretch', gap: "1em", flex: 1}}>
          <h3 style={{ textAlign: 'start'}}>Últimos registros</h3>
          <div className="card">
            <div className="user-icon">
              <LuUser size={24} />
            </div>
            <div style={{margin: "0 0 0 1em", display: 'flex', flexDirection: 'column', gap: "0.0em", justifyContent: 'center', alignItems: 'start'}}>
              <span>John Doe</span>
              <span style={{ fontSize: '0.9em', color: '#666' }}>2023-05-15</span>
            </div>
            <div style={{ margin: "0 0 0 auto", display: 'flex', flexDirection: 'row', gap: ".5em", justifyContent: 'center', alignItems: 'center'}}>
              <div style={{display: 'flex', alignItems: 'center', backgroundColor: '#f3f4f6', padding: '0.25em 0.5em', borderRadius: '0.25rem', gap: '0.25em'}}>
                <LuChartLine size={20} /> 
              </div> 
              1.5
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', gap: ".5em", justifyContent: 'center', alignItems: 'center'}}>
              <div style={{display: 'flex', alignItems: 'center', backgroundColor: '#f3f4f6', padding: '0.25em 0.5em', borderRadius: '0.25rem', gap: '0.25em'}}>
                <LuHash size={20} /> 
              </div> 
              5 / 5
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', gap: ".5em", justifyContent: 'center', alignItems: 'center'}}>
              <div style={{display: 'flex', alignItems: 'center', backgroundColor: '#f3f4f6', padding: '0.25em 0.5em', borderRadius: '0.25rem', gap: '0.25em'}}>
                <LuArrowDownToLine size={20} /> 
              </div> 
              Local
            </div>
          </div>
        </div>
        <div style={{display: 'flex', flexDirection:'column', justifyContent: 'start', alignItems: 'stretch', gap: "1em", flex: 1}}>
          <h3 style={{ textAlign: 'start'}}>Próximos pacientes</h3>
          <div className="card">
            <div className="user-icon">
              <LuUser size={24} />
            </div>
            <div style={{margin: "0 0 0 1em", display: 'flex', flexDirection: 'column', gap: "0.0em", justifyContent: 'center', alignItems: 'start'}}>
              <Link to="/patients/1">John Doe</Link>
            </div>
            <div style={{ margin: "0 0 0 auto", display: 'flex', flexDirection: 'row', gap: ".5em", justifyContent: 'center', alignItems: 'center'}}>
              <div style={{display: 'flex', alignItems: 'center', backgroundColor: '#f3f4f6', padding: '0.25em 0.5em', borderRadius: '0.25rem', gap: '0.25em'}}>
                <LuChartLine size={20} /> 
              </div> 
              1.5
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', gap: ".5em", justifyContent: 'center', alignItems: 'center'}}>
              <div style={{display: 'flex', alignItems: 'center', backgroundColor: '#f3f4f6', padding: '0.25em 0.5em', borderRadius: '0.25rem', gap: '0.25em'}}>
                <LuHash size={20} /> 
              </div> 
              5 / 5
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', gap: ".5em", justifyContent: 'center', alignItems: 'center'}}>
              <div style={{display: 'flex', alignItems: 'center', backgroundColor: '#f3f4f6', padding: '0.25em 0.5em', borderRadius: '0.25rem', gap: '0.25em'}}>
                <LuHistory size={20} /> 
              </div> 
              2 meses
            </div>
          </div>
        </div>
        
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