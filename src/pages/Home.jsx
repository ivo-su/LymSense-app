import { LuCirclePlus, LuList, LuUsers } from "react-icons/lu";

function Home() {
  return (
    <div>
      <h1 style={{ textAlign: 'start'}}>Welcome back!</h1>
      <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', gap: "1em"}}>
        <button className="btn"><LuCirclePlus /> Nuevo registro</button>
        <button className="btn"><LuList />Ver registros</button>
        <button className="btn"><LuUsers />Ver pacientes</button>
      </div>
    </div>
  );
}

export default Home;