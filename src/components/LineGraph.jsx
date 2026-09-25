import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend} from 'chart.js'
ChartJS.defaults.transitions.resize.animation.duration = 0;

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

function LineGraph({ logs = [], referenceLog }){
  const options = {
    responsive: true,
    // animation: false,
    maintainAspectRatio: false,
    resizeDelay: 0,
    // transitions: {
    //   resize: {
    //     animation: false
    //   }
    // },
    // aspectRatio: 2,
    plugins: {
      legend: {
        display: true
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Número de registro'
        }
      },
      y: {
        title: {
          display: true,
          text: 'L-ratio'
        }
      }
    }
  }
  const data = {
    labels: logs.map((log) => log.log_number),
    datasets: [
      {
        label: 'L-ratio (sano)',
        data: logs.map((log) => log.ldex),
        borderColor: '#00AAA5',
        backgroundColor: '#00AAA5',
        pointBackgroundColor: '#00AAA5'
      },
      ...(referenceLog?.z_risk != null ? [{
        label: 'L-ratio (referencia)',
        data: logs.map((log) => {
          if (!Number.isFinite(referenceLog.z_risk) || !Number.isFinite(log.z_risk) || log.z_risk === 0) {
            return null;
          }
          return referenceLog.z_risk / log.z_risk;
        }),
        borderColor: '#d97706',
        backgroundColor: '#d97706',
        pointBackgroundColor: '#d97706',
        borderDash: [6, 4]
      }] : [])
    ]
  }
  
  return <>
    <Line
      options={options}
      data={data}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  </>
}

export default LineGraph