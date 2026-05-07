import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import PieChart from '../components/charts/PieChart';
import BarChart from '../components/charts/BarChart';
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
  const monthNames = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];
  return `${monthNames[mm - 1]} ${year}`;
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

function normalizeCategory(name = '') {
  return name.toLowerCase().trim();
}

function CategoryIcon({ name = '', color = '#6366f1', size = 14 }) {
  const key = normalizeCategory(name);
  const s = { width: size, height: size, flexShrink: 0 };
  const p = { fill: 'none', stroke: color, strokeWidth: 1.8 };

  if (['shopping', 'haine', 'imbracaminte', 'incaltamine'].includes(key))
    return <svg viewBox="0 0 24 24" style={s} {...p}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;

  if (['food', 'mancare', 'nutritionist'].includes(key))
    return <svg viewBox="0 0 24 24" style={s} {...p}><path d="M7 3v7M10 3v7M7 7h3M16 3v18M16 11c2.2 0 4-1.8 4-4V3h-4"/></svg>;

  if (['transport', 'bolt', 'metrou', 'transfer', 'rovigneta'].includes(key))
    return <svg viewBox="0 0 24 24" style={s} {...p}><path d="M4 13l1.5-5a2 2 0 0 1 1.9-1.4h9.2A2 2 0 0 1 18.5 8L20 13v4h-2v2h-2v-2H8v2H6v-2H4v-4z"/><circle cx="7.5" cy="14.5" r="1"/><circle cx="16.5" cy="14.5" r="1"/></svg>;

  if (['housing', 'intretinere apt'].includes(key))
    return <svg viewBox="0 0 24 24" style={s} {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;

  if (['entertainment', 'diverse', 'grecia-thassos'].includes(key))
    return <svg viewBox="0 0 24 24" style={s} {...p}><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>;

  if (['energie electrica', 'digi'].includes(key))
    return <svg viewBox="0 0 24 24" style={s} {...p}><path d="M13 2L6 13h5l-1 9 8-12h-5l0-8z"/></svg>;

  if (['asigurari', 'vitamine'].includes(key))
    return <svg viewBox="0 0 24 24" style={s} {...p}><path d="M12 3l7 3v6c0 5-3.2 8-7 9-3.8-1-7-4-7-9V6l7-3z"/></svg>;

  return <svg viewBox="0 0 24 24" style={s} {...p}><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>;
}

function MetricCardIcon({ type }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, width: 13, height: 13 };
  if (type === 'money')  return <svg viewBox="0 0 24 24" {...p}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>;
  if (type === 'cal')    return <svg viewBox="0 0 24 24" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
  if (type === 'tx')     return <svg viewBox="0 0 24 24" {...p}><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>;
  if (type === 'trend')  return <svg viewBox="0 0 24 24" {...p}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
  return null;
}

function MetricCard({ label, value, delta, deltaTone = 'success', iconType = 'money' }) {
  return (
    <div className="app-panel p-5">
      <p className="panel-label inline-flex items-center gap-2">
        <span className="grid h-5 w-5 place-items-center rounded-md bg-slate-100 text-slate-500">
          <MetricCardIcon type={iconType} />
        </span>
        <span>{label}</span>
      </p>
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
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg>
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
                <span
                  className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-semibold"
                  style={{ background: `${item.color}22`, color: item.color }}
                >
                  {(item.title || '?').slice(0, 2).toUpperCase()}
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
            <MetricCard iconType="money" label="This month" value={formatMoney(currentTotal)} delta={`${formatPercent(delta)} vs last month`} deltaTone={delta > 0 ? 'danger' : 'success'} />
            <MetricCard iconType="cal" label="Last month" value={formatMoney(previousTotal)} delta="↑ 5% vs previous" />
            <MetricCard iconType="tx" label="Transactions" value={transactionCount.toLocaleString('ro-RO')} delta={`+${Math.max(transactionCount - Math.round(transactionCount * 0.8), 0)} vs last month`} />
            <MetricCard iconType="trend" label="Avg. per day" value={formatMoney(avgPerDay)} delta={`${formatPercent(delta / 2)} vs avg`} deltaTone={delta > 0 ? 'danger' : 'success'} />
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
                        <span
                          className="grid h-6 w-6 place-items-center rounded-full text-[12px]"
                          style={{ background: `${category.color}1f`, color: category.color }}
                        >
                            <CategoryIcon name={category.name} color={category.color} size={13} />
                        </span>
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
              <div className="p-4">
                <BarChart
                  data={{
                    labels: (report.charts.bar.labels || []).map((l) =>
                      new Date(`${l}-01`).toLocaleDateString('ro-RO', { month: 'short' })
                    ),
                    datasets: [{
                      label: 'Cheltuieli',
                      data: report.charts.bar.datasets[0].data.map(Number),
                      backgroundColor: 'rgba(99,102,241,0.8)',
                      borderRadius: 6,
                      borderSkipped: false,
                    }],
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` RON ${ctx.parsed.y.toLocaleString('ro-RO')}` } } },
                    scales: {
                      x: { grid: { display: false }, ticks: { font: { size: 12 } } },
                      y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 }, callback: (v) => `${v.toLocaleString('ro-RO')}` } },
                    },
                  }}
                />
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
                        <CategoryIcon name={expense.category?.name} color={expense.category?.color || '#6366f1'} size={17} />
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
                        <span className="inline-flex items-center gap-2 font-medium text-slate-900">
                          <span
                            className="grid h-5 w-5 place-items-center rounded-full text-[11px]"
                            style={{ background: `${category.color}1f`, color: category.color }}
                          >
                            <CategoryIcon name={category.name} color={category.color} size={12} />
                          </span>
                          <span>{category.name}</span>
                        </span>
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
