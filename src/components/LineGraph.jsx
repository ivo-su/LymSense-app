import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

function LineGraph(){
  const options = {}
  const data = {
    labels: ['Registro 1', 'Registro 2', 'Registro 3', 'Registro 4', 'Registro 5'],
    datasets: [
      {
        label: 'L-dex',
        data: [1.4, 5.2, 9.1, 14.8, 24.3]
      }
    ]
  }
  
  return <>
    <Line  options={options} data={data}/>
  </>
}

export default LineGraph