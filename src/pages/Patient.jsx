import { LuUser } from 'react-icons/lu';
import Chart from '../components/Chart';
import LineGraph from '../components/LineGraph';

function Patient(){
  const registros = [
    { log_n: 1, ldex: 1.4, date: '2023-01-01' },
    { log_n: 2, ldex: 5.2, date: '2023-02-01' },
    { log_n: 3, ldex: 9.1, date: '2023-03-01' },
    { log_n: 4, ldex: 14.8, date: '2023-04-01' },
    { log_n: 5, ldex: 24.3, date: '2023-05-01' },
    { log_n: 6, ldex: 35.1, date: '2023-06-01' },
    { log_n: 7, ldex: 45.2, date: '2023-07-01' },
  ];

  return (<>
  <div className="box">
    <h1>Historial del paciente</h1>
  </div>

    <div className="patient-overview">


    <div className='box patient-info'>
      <h3>Información</h3>
      <span>Nombre: John Doe</span>
      <span>Registros: 5</span>
      <span>Último registro: 2023-10-01</span>
    </div>
    <div className="box" style={{flex: 1, minHeight:"400px"}}>
      <h3>Gráfico de L-dex</h3>
      <div className="graph-container">
        <LineGraph/>
      </div>
    </div>
    </div>
    <div style={{display:"flex", flexDirection:"column", gap:".5em"}}>
        {
          Array(5).fill(0).map((_, index) => 
            <div className="card" key={index}>
              <div className="user-icon">
                <LuUser size={24} />
              </div>
              <div style={{margin: "0 0 0 1em", display: 'flex', flexDirection: 'column', gap: "0.0em", justifyContent: 'center', alignItems: 'start'}}>
                <span>John Doe</span>
                <span style={{ fontSize: '0.9em', color: '#666' }}>2023-05-15</span>
              </div>
              <span>L-dex: 1.5</span>
              <span>Registro {5 - index}/5</span>
              <span>Guardado local</span>
            </div>
          )
        }
        </div>

  </>)
}

export default Patient;