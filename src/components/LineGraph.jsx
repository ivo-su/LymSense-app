import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { getFixedReferenceRatios, getSessionReferenceRatios } from "./lineGraphData";

ChartJS.defaults.transitions.resize.animation.duration = 0;
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function LineGraph({ logs = [], referenceLog }) {
  const sessionRatios = getSessionReferenceRatios(logs);
  const fixedRatios = getFixedReferenceRatios(logs, referenceLog);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 0,
    plugins: {
      legend: { display: true },
      title: { display: false },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Número de sesión",
        },
      },
      y: {
        title: {
          display: true,
          text: "REF / AFE",
        },
      },
    },
  };
  const data = {
    labels: sessionRatios.labels,
    datasets: [
      {
        label: "REF por sesión",
        data: sessionRatios.values,
        borderColor: "#00AAA5",
        backgroundColor: "#00AAA5",
        pointBackgroundColor: "#00AAA5",
        spanGaps: false,
      },
      ...(referenceLog ? [{
        label: `REF fija (sesión ${referenceLog.session_number})`,
        data: fixedRatios.values,
        borderColor: "#d97706",
        backgroundColor: "#d97706",
        pointBackgroundColor: "#d97706",
        borderDash: [6, 4],
        spanGaps: false,
      }] : []),
    ],
  };

  return <Line options={options} data={data} style={{ display: "block", width: "100%", height: "100%" }} />;
}

export default LineGraph;
