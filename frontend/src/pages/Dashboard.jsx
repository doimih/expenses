import { useEffect, useState } from 'react';
import PieChart from '../components/charts/PieChart';
import BarChart from '../components/charts/BarChart';
import LineChart from '../components/charts/LineChart';
import api from '../services/api';

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function Dashboard() {
  const [month, setMonth] = useState(currentMonth());
  const [report, setReport] = useState(null);

  useEffect(() => {
    api.get(`/reports/monthly?month=${month}`).then(({ data }) => setReport(data));
  }, [month]);

  return (
    <div className="space-y-4">
      <div className="card flex items-center justify-between">
        <h2 className="text-xl font-bold">Dashboard</h2>
        <input className="input max-w-[213px]" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      </div>

      {report && (
        <>
          <div className="card">
            <p className="text-sm text-slate-500">Total lunar</p>
            <p className="text-3xl font-bold">{report.total}</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="font-semibold mb-4">Pie chart - Distribuție pe categorii</h3>
              <PieChart data={report.charts.pie} />
            </div>
            <div className="card">
              <h3 className="font-semibold mb-4">Bar chart - Comparație între luni</h3>
              <BarChart data={report.charts.bar} />
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">Line chart - Evoluția cheltuielilor</h3>
            <LineChart data={report.charts.line} />
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">Total pe categorii</h3>
            <div className="space-y-2">
              {report.by_category.map((category) => (
                <div key={category.id} className="flex items-center justify-between rounded border p-2">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ background: category.color }} />
                    <span>{category.name}</span>
                  </div>
                  <span className="font-semibold">{category.total}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
