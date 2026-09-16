import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend} from 'chart.js'
ChartJS.defaults.transitions.resize.animation.duration = 0;

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

function LineGraph(){
  const options = {
    responsive: true,
    animation: false,
    maintainAspectRatio: false,
    resizeDelay: 0,
    transitions: {
      resize: {
        animation: false
      }
    },
    // aspectRatio: 2,
    plugins: {
      legend: {
        display: false
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
          text: 'L-dex'
        }
      }
    }
  }
  const data = {
    labels: [1,2,3,4,5],
    datasets: [
      {
        label: 'L-dex',
        data: [1.4, 5.2, 9.1, 14.8, 24.3],
        borderColor: '#00AAA5',
        backgroundColor: '#00AAA5',
        pointBackgroundColor: '#00AAA5'
      }
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