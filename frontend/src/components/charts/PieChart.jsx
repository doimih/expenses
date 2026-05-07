import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const options = {
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true },
  },
};

export default function PieChart({ data }) {
  return <Pie data={data} options={options} />;
}
