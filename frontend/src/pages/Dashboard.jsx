import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import PieChart from '../components/charts/PieChart';
import api from '../services/api';

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const budgetDefaults = {
  Shopping: 1200,
  Food: 1000,
  Transport: 500,
  Housing: 800,
  Entertainment: 550,
  Other: 300,
};

function formatMoney(value) {
  return `RON ${Number(value || 0).toLocaleString('ro-RO', { maximumFractionDigits: 0 })}`;
}

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return '0%';
  }

  const rounded = Math.round(Math.abs(value));
  return `${value >= 0 ? '↑' : '↓'} ${rounded}%`;
}

function monthLabel(month) {
  const [year, mm] = month.split('-').map(Number);
  return new Date(year, mm - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function timeAgo(value) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 60) {
    return `${Math.max(minutes, 1)} min ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function MetricCard({ label, value, delta, deltaTone = 'success' }) {
  return (
    <div className="app-panel p-5">
      <p className="panel-label">{label}</p>
      <p className="mt-5 text-[22px] font-medium text-slate-900 md:text-[24px]">{value}</p>
      <p className={`mt-2 text-[13px] ${deltaTone === 'danger' ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>{delta}</p>
    </div>
  );
}

function AdminDashboard({ month }) {
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    api.get(`/reports/admin-overview?month=${month}`).then(({ data }) => setOverview(data));
  }, [month]);

  const [filter, setFilter] = useState('all');

  const filteredUsers = useMemo(() => {
    if (!overview) {
      return [];
    }

    if (filter === 'admin') {
      return overview.users_preview.filter((user) => user.role === 'superadmin');
    }

    return overview.users_preview;
  }, [overview, filter]);

  if (!overview) {
    return <div className="app-panel p-6 text-[14px] text-slate-500">Loading admin dashboard...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total users" value={overview.stats.total_users.toLocaleString('ro-RO')} delta="↑ 12% this month" />
        <MetricCard label="Total expenses" value={overview.stats.total_expenses.toLocaleString('ro-RO')} delta="↑ 8% vs last month" />
        <MetricCard label="Monthly volume" value={formatMoney(overview.stats.monthly_volume)} delta="↓ 3% this month" deltaTone="danger" />
        <MetricCard label="Categories" value={overview.stats.categories_count.toLocaleString('ro-RO')} delta="Active globally" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="app-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
            <div className="flex items-center gap-3">
              <h2 className="panel-title">Users</h2>
              <div className="flex items-center gap-2 rounded-full bg-stone-100 p-1 text-[12px]">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'active', label: 'Active' },
                  { id: 'admin', label: 'Admin' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilter(item.id)}
                    className={`rounded-full px-3 py-1.5 ${filter === item.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <Link to="/users" className="rounded-xl border border-black/10 px-4 py-2 text-[13px] font-medium text-slate-700">View all</Link>
          </div>

          <div className="grid grid-cols-[1.5fr_0.8fr_0.6fr] gap-3 border-b border-black/5 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            <span>User</span>
            <span>Role</span>
            <span>Status</span>
          </div>

          <div>
            {filteredUsers.map((user) => (
              <div key={user.id} className="grid grid-cols-[1.5fr_0.8fr_0.6fr] gap-3 border-b border-black/5 px-5 py-4 text-[14px] last:border-b-0">
                <div>
                  <p className="font-medium text-slate-900">{user.name}</p>
                  <p className="text-[12px] text-slate-500">{user.email}</p>
                </div>
                <div>
                  <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--accent)]">
                    {user.role}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[13px] text-[var(--success)]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--success)]" />
                  {user.status}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="app-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
            <h2 className="panel-title">Activity log</h2>
            <button className="rounded-xl border border-black/10 px-4 py-2 text-[13px] font-medium text-slate-700">View all</button>
          </div>
          <div>
            {overview.activity.map((item, index) => (
              <div key={`${item.type}-${index}`} className="flex gap-3 border-b border-black/5 px-5 py-4 last:border-b-0">
                <span className="mt-1 h-10 w-10 flex-shrink-0 rounded-full" style={{ background: `${item.color}14` }}>
                  <span className="m-3 block h-4 w-4 rounded-full" style={{ background: item.color }} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="text-[13px] text-slate-600">{item.description}</p>
                  <p className="micro-copy mt-1">{timeAgo(item.timestamp)} · {typeof item.meta === 'string' && item.meta.includes('@') ? item.meta : 'system'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function Dashboard({ user }) {
  const [month, setMonth] = useState(currentMonth());
  const [report, setReport] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    if (user?.role === 'superadmin') {
      return;
    }

    Promise.all([
      api.get(`/reports/monthly?month=${month}`),
      api.get(`/expenses?month=${month}`),
    ]).then(([reportResponse, expensesResponse]) => {
      setReport(reportResponse.data);
      setExpenses(expensesResponse.data);
    });
  }, [month, user?.role]);

  const previousTotal = useMemo(() => {
    const values = report?.charts?.bar?.datasets?.[0]?.data || [];
    return values.length > 1 ? Number(values[values.length - 2]) : 0;
  }, [report]);

  const transactionCount = expenses.length;
  const currentTotal = Number(report?.total || 0);
  const delta = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
  const avgPerDay = (() => {
    const [year, mm] = month.split('-').map(Number);
    const daysInMonth = new Date(year, mm, 0).getDate();
    const isCurrentMonth = month === currentMonth();
    const divisor = isCurrentMonth ? new Date().getDate() : daysInMonth;
    return divisor > 0 ? currentTotal / divisor : 0;
  })();

  const categoryBreakdown = useMemo(() => {
    return (report?.by_category || []).map((category) => ({
      ...category,
      share: currentTotal > 0 ? (Number(category.total) / currentTotal) * 100 : 0,
      limit: Math.max(Number(category.total) * 1.25, budgetDefaults[category.name] || 300),
    }));
  }, [month]);

  const overallBudget = categoryBreakdown.reduce((sum, item) => sum + item.limit, 0);

  if (user?.role === 'superadmin') {
    return <AdminDashboard month={month} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 rounded-[20px] border border-black/5 bg-white px-5 py-5 md:flex-row md:items-start">
        <div>
          <h2 className="text-[16px] font-medium text-slate-900">Bun venit, {user?.first_name || user?.name || 'Andrei'} 👋</h2>
          <p className="mt-1 text-[14px] text-slate-500">Here's your financial overview for {monthLabel(month)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl border border-black/10 bg-white p-1 text-[13px]">
            {['week', 'month', 'quarter', 'year'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPeriod(item)}
                className={`rounded-[10px] px-4 py-2 capitalize ${period === item ? 'bg-stone-100 font-medium text-slate-900' : 'text-slate-500'}`}
              >
                {item}
              </button>
            ))}
          </div>
          <input className="input max-w-[180px]" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        </div>
      </div>

      {report && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="This month" value={formatMoney(currentTotal)} delta={`${formatPercent(delta)} vs last month`} deltaTone={delta > 0 ? 'danger' : 'success'} />
            <MetricCard label="Last month" value={formatMoney(previousTotal)} delta="↑ 5% vs previous" />
            <MetricCard label="Transactions" value={transactionCount.toLocaleString('ro-RO')} delta={`+${Math.max(transactionCount - Math.round(transactionCount * 0.8), 0)} vs last month`} />
            <MetricCard label="Avg. per day" value={formatMoney(avgPerDay)} delta={`${formatPercent(delta / 2)} vs avg`} deltaTone={delta > 0 ? 'danger' : 'success'} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
            <section className="app-panel overflow-hidden">
              <div className="border-b border-black/5 px-4 py-4">
                <h3 className="panel-title">By category</h3>
              </div>
              <div className="p-4">
                <div className="mx-auto max-w-[220px]">
                  <PieChart data={report.charts.pie} />
                </div>
                <div className="mt-4 space-y-3">
                  {categoryBreakdown.map((category) => (
                    <div key={category.id} className="flex items-center justify-between text-[14px]">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: category.color }} />
                        <span>{category.name}</span>
                      </div>
                      <span className="font-medium text-slate-900">{Math.round(category.share)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="app-panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-black/5 px-4 py-4">
                <h3 className="panel-title">Last 6 months</h3>
                <span className="text-[13px] text-slate-500">Monthly spend</span>
              </div>
              <div className="space-y-4 p-5">
                {(report.charts.bar.labels || []).map((label, index) => {
                  const value = Number(report.charts.bar.datasets[0].data[index] || 0);
                  const maxValue = Math.max(...report.charts.bar.datasets[0].data.map(Number), 1);
                  const width = `${Math.max((value / maxValue) * 100, 12)}%`;

                  return (
                    <div key={label} className="grid grid-cols-[34px_minmax(0,1fr)] items-center gap-4">
                      <span className="text-[13px] text-slate-600">{new Date(`${label}-01`).toLocaleDateString('en-US', { month: 'short' })}</span>
                      <div className="relative h-6 overflow-hidden rounded-[8px] bg-stone-100">
                        <div className="absolute inset-y-0 left-0 rounded-[8px] bg-[var(--accent)]/90 px-3 text-right text-[11px] font-medium leading-6 text-white" style={{ width }}>
                          {Number(value).toLocaleString('ro-RO')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
            <section className="app-panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
                <h3 className="panel-title">Recent expenses</h3>
                <Link to="/expenses" className="text-[13px] font-medium text-[var(--accent)]">View all →</Link>
              </div>
              <div>
                {expenses.slice(0, 4).map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between gap-4 border-b border-black/5 px-5 py-4 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full text-[11px] font-medium" style={{ background: `${expense.category?.color || '#6366f1'}14`, color: expense.category?.color || '#6366f1' }}>
                        □
                      </span>
                      <div>
                        <p className="font-medium text-slate-900">{expense.description || `${expense.category?.name} expense`}</p>
                        <p className="text-[13px] text-slate-500">{expense.category?.name} · {expense.date}</p>
                      </div>
                    </div>
                    <span className="font-medium text-slate-900">{formatMoney(expense.amount)}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="app-panel overflow-hidden">
              <div className="border-b border-black/5 px-5 py-4">
                <h3 className="panel-title">Budget progress</h3>
              </div>
              <div className="space-y-4 p-5">
                {categoryBreakdown.map((category) => {
                  const progress = category.limit > 0 ? (Number(category.total) / category.limit) * 100 : 0;
                  const tone = progress > 90 ? 'var(--danger)' : progress > 70 ? 'var(--warning)' : 'var(--success)';
                  return (
                    <div key={category.id}>
                      <div className="mb-1 flex items-center justify-between text-[13px]">
                        <span className="font-medium text-slate-900">{category.name}</span>
                        <span className="text-slate-500">{Number(category.total).toLocaleString('ro-RO')} / {Math.round(category.limit).toLocaleString('ro-RO')}</span>
                      </div>
                      <div className="h-2 rounded-full bg-stone-100">
                        <div className="h-2 rounded-full" style={{ width: `${Math.min(progress, 100)}%`, background: tone }} />
                      </div>
                    </div>
                  );
                })}

                <div className="border-t border-black/5 pt-4">
                  <p className="text-[13px] text-slate-500">Overall budget</p>
                  <p className="mt-2 text-[18px] font-medium text-slate-900">{formatMoney(currentTotal)} <span className="text-[14px] text-slate-500">/ {overallBudget.toLocaleString('ro-RO', { maximumFractionDigits: 0 })}</span></p>
                  <p className="mt-1 text-[13px] text-[var(--warning)]">{Math.round((currentTotal / Math.max(overallBudget, 1)) * 100)}% used — 25 days left</p>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
