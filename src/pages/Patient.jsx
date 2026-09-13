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
    <h1>Paciente</h1>

    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: "1em"}}>


    <div style={{display: 'flex',flexDirection:'column', justifyContent: 'start', alignItems: 'start', gap: "1em", padding: "2em 0"}}>
      <span>Nombre: John Doe</span>
      <span>Registros: 5</span>
      <span>Último registro: 2023-10-01</span>
    </div>

    <Chart
      data={registros} 
      xKey="log_n"
      yKey="ldex"
      title=""
      yAxisLabel="L-dex"
      valueLabel="L-dex"
      xAxisLabel="Registro"
      formatX={(value) => String(value)}
      tooltipFields={[
        { key: 'date', label: 'Fecha' },
        { key: 'ldex', label: 'L-dex', format: (value) => String(value) },
      ]}
      />
      </div>

      <LineGraph/>
  </>)
}

export default Patient;