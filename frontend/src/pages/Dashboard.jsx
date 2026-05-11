import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useLocale } from '../i18n/LocaleContext';
import PieChart from '../components/charts/PieChart';
import BarChart from '../components/charts/BarChart';
import {
  IconBolt,
  IconCalendarEvent,
  IconCar,
  IconCircleCheck,
  IconCreditCard,
  IconDeviceTv,
  IconHome,
  IconReceipt,
  IconShieldCheck,
  IconShoppingBag,
  IconSparkles,
  IconToolsKitchen2,
  IconTrendingUp,
} from '@tabler/icons-react';
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

function formatMoney(value, localeCode = 'ro-RO') {
  return `RON ${Number(value || 0).toLocaleString(localeCode, { maximumFractionDigits: 0 })}`;
}

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return '0%';
  }

  const rounded = Math.round(Math.abs(value));
  return `${value >= 0 ? '↑' : '↓'} ${rounded}%`;
}

function monthLabel(month, locale = 'ro') {
  const [year, mm] = month.split('-').map(Number);
  const monthNames = locale === 'ro'
    ? ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${monthNames[mm - 1]} ${year}`;
}

function timeAgo(value, locale = 'ro') {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 60) {
    return locale === 'ro' ? `acum ${Math.max(minutes, 1)} min` : `${Math.max(minutes, 1)} min ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return locale === 'ro' ? `acum ${hours} ore` : `${hours} hr ago`;
  }

  const days = Math.floor(hours / 24);
  return locale === 'ro' ? `acum ${days} zi${days === 1 ? '' : 'le'}` : `${days} day${days === 1 ? '' : 's'} ago`;
}

function normalizeCategory(name = '') {
  return name.toLowerCase().trim();
}

function CategoryIcon({ name = '', color = '#6366f1', size = 14 }) {
  const key = normalizeCategory(name);
  const props = { size, stroke: 1.8, color, style: { flexShrink: 0 } };

  if (['shopping', 'haine', 'imbracaminte', 'incaltamine'].includes(key))
    return <IconShoppingBag {...props} />;

  if (['food', 'mancare', 'nutritionist'].includes(key))
    return <IconToolsKitchen2 {...props} />;

  if (['transport', 'bolt', 'metrou', 'transfer', 'rovigneta'].includes(key))
    return <IconCar {...props} />;

  if (['housing', 'intretinere apt'].includes(key))
    return <IconHome {...props} />;

  if (['entertainment', 'diverse', 'grecia-thassos'].includes(key))
    return <IconDeviceTv {...props} />;

  if (['energie electrica', 'digi'].includes(key))
    return <IconBolt {...props} />;

  if (['asigurari', 'vitamine'].includes(key))
    return <IconShieldCheck {...props} />;

  return <IconSparkles {...props} />;
}

function MetricCardIcon({ type }) {
  const props = { size: 13, stroke: 1.8 };
  if (type === 'money') return <IconCreditCard {...props} aria-hidden="true" />;
  if (type === 'cal') return <IconCalendarEvent {...props} aria-hidden="true" />;
  if (type === 'tx') return <IconReceipt {...props} aria-hidden="true" />;
  if (type === 'trend') return <IconTrendingUp {...props} aria-hidden="true" />;
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
  const { locale } = useLocale();
  const [overview, setOverview] = useState(null);
  const numberLocale = locale === 'ro' ? 'ro-RO' : 'en-US';
  const L = locale === 'ro'
    ? {
        all: 'Toate',
        active: 'Active',
        admin: 'Admin',
        users: 'Utilizatori',
        activity: 'Jurnal activitate',
        viewAll: 'Vezi tot',
        user: 'Utilizator',
        role: 'Rol',
        status: 'Status',
        title: 'Tablou de bord admin',
        loading: 'Se încarcă dashboard-ul admin...',
      }
    : {
        all: 'All',
        active: 'Active',
        admin: 'Admin',
        users: 'Users',
        activity: 'Activity log',
        viewAll: 'View all',
        user: 'User',
        role: 'Role',
        status: 'Status',
        title: 'Admin dashboard',
        loading: 'Loading admin dashboard...',
      };

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
    return <div className="app-panel p-6 text-[14px] text-slate-500">{L.loading}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={locale === 'ro' ? 'Total utilizatori' : 'Total users'} value={overview.stats.total_users.toLocaleString(numberLocale)} delta={locale === 'ro' ? '↑ 12% luna aceasta' : '↑ 12% this month'} />
        <MetricCard label={locale === 'ro' ? 'Total cheltuieli' : 'Total expenses'} value={overview.stats.total_expenses.toLocaleString(numberLocale)} delta={locale === 'ro' ? '↑ 8% față de luna trecută' : '↑ 8% vs last month'} />
        <MetricCard label={locale === 'ro' ? 'Volum lunar' : 'Monthly volume'} value={formatMoney(overview.stats.monthly_volume, numberLocale)} delta={locale === 'ro' ? '↓ 3% luna aceasta' : '↓ 3% this month'} deltaTone="danger" />
        <MetricCard label={locale === 'ro' ? 'Categorii' : 'Categories'} value={overview.stats.categories_count.toLocaleString(numberLocale)} delta={locale === 'ro' ? 'Active global' : 'Active globally'} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="app-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
            <div className="flex items-center gap-3">
              <h2 className="panel-title">{L.users}</h2>
              <div className="flex items-center gap-2 rounded-full bg-stone-100 p-1 text-[12px]">
                {[
                  { id: 'all', label: L.all },
                  { id: 'active', label: L.active },
                  { id: 'admin', label: L.admin },
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
            <Link to="/users" className="rounded-xl border border-black/10 px-4 py-2 text-[13px] font-medium text-slate-700">{L.viewAll}</Link>
          </div>

          <div className="grid grid-cols-[1.5fr_0.8fr_0.6fr] gap-3 border-b border-black/5 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            <span>{L.user}</span>
            <span>{L.role}</span>
            <span>{L.status}</span>
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
                  <IconCircleCheck size={14} stroke={2.2} aria-hidden="true" />
                  {user.status}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="app-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
            <h2 className="panel-title">{L.activity}</h2>
            <button className="rounded-xl border border-black/10 px-4 py-2 text-[13px] font-medium text-slate-700">{L.viewAll}</button>
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
                  <p className="micro-copy mt-1">{timeAgo(item.timestamp, locale)} · {typeof item.meta === 'string' && item.meta.includes('@') ? item.meta : (locale === 'ro' ? 'sistem' : 'system')}</p>
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
  const { locale } = useLocale();
  const numberLocale = locale === 'ro' ? 'ro-RO' : 'en-US';
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
          <h2 className="text-[16px] font-medium text-slate-900">{locale === 'ro' ? 'Bun venit' : 'Welcome'}, {user?.first_name || user?.name || 'Andrei'} 👋</h2>
          <p className="mt-1 text-[14px] text-slate-500">{locale === 'ro' ? 'Aici este situația ta financiară pentru' : 'Here is your financial overview for'} {monthLabel(month, locale)}</p>
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
            <MetricCard iconType="money" label={locale === 'ro' ? 'Luna aceasta' : 'This month'} value={formatMoney(currentTotal, numberLocale)} delta={`${formatPercent(delta)} ${locale === 'ro' ? 'față de luna trecută' : 'vs last month'}`} deltaTone={delta > 0 ? 'danger' : 'success'} />
            <MetricCard iconType="cal" label={locale === 'ro' ? 'Luna trecută' : 'Last month'} value={formatMoney(previousTotal, numberLocale)} delta={locale === 'ro' ? '↑ 5% față de perioada anterioară' : '↑ 5% vs previous'} />
            <MetricCard iconType="tx" label={locale === 'ro' ? 'Tranzacții' : 'Transactions'} value={transactionCount.toLocaleString(numberLocale)} delta={`+${Math.max(transactionCount - Math.round(transactionCount * 0.8), 0)} ${locale === 'ro' ? 'față de luna trecută' : 'vs last month'}`} />
            <MetricCard iconType="trend" label={locale === 'ro' ? 'Medie/zi' : 'Avg. per day'} value={formatMoney(avgPerDay, numberLocale)} delta={`${formatPercent(delta / 2)} ${locale === 'ro' ? 'față de medie' : 'vs avg'}`} deltaTone={delta > 0 ? 'danger' : 'success'} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
            <section className="app-panel overflow-hidden">
              <div className="border-b border-black/5 px-4 py-4">
                <h3 className="panel-title">{locale === 'ro' ? 'Pe categorii' : 'By category'}</h3>
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
                <h3 className="panel-title">{locale === 'ro' ? 'Ultimele 6 luni' : 'Last 6 months'}</h3>
                <span className="text-[13px] text-slate-500">{locale === 'ro' ? 'Cheltuieli lunare' : 'Monthly spend'}</span>
              </div>
              <div className="p-4">
                <BarChart
                  data={{
                    labels: (report.charts.bar.labels || []).map((l) =>
                      new Date(`${l}-01`).toLocaleDateString(numberLocale, { month: 'short' })
                    ),
                    datasets: [{
                      label: locale === 'ro' ? 'Cheltuieli' : 'Expenses',
                      data: report.charts.bar.datasets[0].data.map(Number),
                      backgroundColor: 'rgba(99,102,241,0.8)',
                      borderRadius: 6,
                      borderSkipped: false,
                    }],
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` RON ${ctx.parsed.y.toLocaleString(numberLocale)}` } } },
                    scales: {
                      x: { grid: { display: false }, ticks: { font: { size: 12 } } },
                      y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 }, callback: (v) => `${v.toLocaleString(numberLocale)}` } },
                    },
                  }}
                />
              </div>
            </section>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
            <section className="app-panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
                <h3 className="panel-title">{locale === 'ro' ? 'Cheltuieli recente' : 'Recent expenses'}</h3>
                <Link to="/expenses" className="text-[13px] font-medium text-[var(--accent)]">{locale === 'ro' ? 'Vezi tot →' : 'View all →'}</Link>
              </div>
              <div>
                {expenses.slice(0, 4).map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between gap-4 border-b border-black/5 px-5 py-4 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full text-[11px] font-medium" style={{ background: `${expense.category?.color || '#6366f1'}14`, color: expense.category?.color || '#6366f1' }}>
                        <CategoryIcon name={expense.category?.name} color={expense.category?.color || '#6366f1'} size={17} />
                      </span>
                      <div>
                        <p className="font-medium text-slate-900">{expense.description || `${expense.category?.name} ${locale === 'ro' ? 'cheltuială' : 'expense'}`}</p>
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
                <h3 className="panel-title">{locale === 'ro' ? 'Progres buget' : 'Budget progress'}</h3>
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
                        <span className="text-slate-500">{Number(category.total).toLocaleString(numberLocale)} / {Math.round(category.limit).toLocaleString(numberLocale)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-stone-100">
                        <div className="h-2 rounded-full" style={{ width: `${Math.min(progress, 100)}%`, background: tone }} />
                      </div>
                    </div>
                  );
                })}

                <div className="border-t border-black/5 pt-4">
                  <p className="text-[13px] text-slate-500">{locale === 'ro' ? 'Buget total' : 'Overall budget'}</p>
                  <p className="mt-2 text-[18px] font-medium text-slate-900">{formatMoney(currentTotal, numberLocale)} <span className="text-[14px] text-slate-500">/ {overallBudget.toLocaleString(numberLocale, { maximumFractionDigits: 0 })}</span></p>
                  <p className="mt-1 text-[13px] text-[var(--warning)]">{Math.round((currentTotal / Math.max(overallBudget, 1)) * 100)}% {locale === 'ro' ? 'folosit' : 'used'} — {locale === 'ro' ? '25 de zile rămase' : '25 days left'}</p>
                </div>
              </div>
            </section>
          </div>

        </>
      )}
    </div>
  );
}
