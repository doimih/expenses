import { useEffect, useMemo, useState } from 'react';
import { useLocale } from '../i18n/LocaleContext';
import api from '../services/api';

const PER_PAGE = 50;

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function toneByType(type) {
  const key = String(type || '').toLowerCase();
  if (key.includes('delete') || key.includes('error')) {
    return { bg: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', label: 'danger' };
  }

  if (key.includes('create') || key.includes('login') || key.includes('register')) {
    return { bg: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', label: 'success' };
  }

  return { bg: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', label: 'info' };
}

function formatTimestamp(value, locale = 'ro') {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale === 'ro' ? 'ro-RO' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizeText(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function normalizeErrorMessage(value, locale = 'ro') {
  if (!value) return locale === 'ro' ? 'Nu am putut încărca log-urile de sistem.' : 'Could not load system logs.';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (typeof value.message === 'string') return value.message;
    if (typeof value.error === 'string') return value.error;
    try {
      return JSON.stringify(value);
    } catch {
      return locale === 'ro' ? 'A apărut o eroare necunoscută.' : 'Unknown error occurred.';
    }
  }
  return String(value);
}

export default function SystemLogs() {
  const { locale } = useLocale();
  const [month, setMonth] = useState(currentMonth());
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, per_page: PER_PAGE, total: 0, last_page: 1 });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const { data } = await api.get(`/reports/admin-overview?month=${month}&page=${page}&per_page=${PER_PAGE}`);
        if (!cancelled) {
          setActivity(data?.activity || []);
          setPagination(data?.activity_pagination || { page, per_page: PER_PAGE, total: (data?.activity || []).length, last_page: 1 });
        }
      } catch (requestError) {
        if (!cancelled) {
          setActivity([]);
          setPagination({ page: 1, per_page: PER_PAGE, total: 0, last_page: 1 });
          setError(normalizeErrorMessage(requestError?.response?.data?.message ?? requestError?.response?.data, locale));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [month, page, locale]);

  useEffect(() => { setPage(1); }, [month]);

  const typeOptions = useMemo(() => ['all', ...new Set(activity.map((item) => item.type).filter(Boolean))], [activity]);

  const filtered = useMemo(() => activity.filter((item) => {
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    if (!query.trim()) return true;
    const haystack = `${normalizeText(item.title)} ${normalizeText(item.description)} ${normalizeText(item.meta)}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  }), [activity, query, typeFilter]);

  return (
    <div className="space-y-4">
      <div className="app-panel px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="panel-label">{locale === 'ro' ? 'Sistem' : 'System'}</p>
            <h2 className="mt-1 text-[18px] font-medium text-slate-900">{locale === 'ro' ? 'Jurnal sistem' : 'System Log'}</h2>
            <p className="mt-1 text-[13px] text-slate-500">{locale === 'ro' ? 'Evenimente de audit din activitatea platformei.' : 'Audit events from platform activity.'}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input className="input w-[180px]" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
            <select className="input w-[180px]" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              {typeOptions.map((type) => (
                <option key={type} value={type}>{type === 'all' ? (locale === 'ro' ? 'Toate tipurile' : 'All types') : type}</option>
              ))}
            </select>
            <input className="input w-[260px]" placeholder={locale === 'ro' ? 'Caută în log-uri...' : 'Search logs...'} value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </div>
      </div>

      <div className="app-panel overflow-hidden">
        <div className="grid grid-cols-[170px_130px_1fr_1fr_140px] gap-3 border-b border-black/5 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
          <span>{locale === 'ro' ? 'Moment' : 'Timestamp'}</span>
          <span>{locale === 'ro' ? 'Tip' : 'Type'}</span>
          <span>{locale === 'ro' ? 'Titlu' : 'Title'}</span>
          <span>{locale === 'ro' ? 'Descriere' : 'Description'}</span>
          <span className="text-right">Meta</span>
        </div>

        {loading ? (
          <div className="px-5 py-6 text-[14px] text-slate-500">{locale === 'ro' ? 'Se încarcă log-urile de sistem...' : 'Loading system logs...'}</div>
        ) : error ? (
          <div className="px-5 py-6 text-[14px] text-[var(--danger)]">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-6 text-[14px] text-slate-500">{locale === 'ro' ? 'Nu există evenimente pentru filtrele selectate.' : 'No events match the selected filters.'}</div>
        ) : (
          <div>
            {filtered.map((item, index) => {
              const tone = toneByType(item.type);
              return (
                <div key={`${item.type || 'event'}-${index}`} className="grid grid-cols-[170px_130px_1fr_1fr_140px] gap-3 border-b border-black/5 px-5 py-4 text-[14px] last:border-b-0">
                  <span className="text-[13px] text-slate-600">{formatTimestamp(item.timestamp, locale)}</span>
                  <span className="inline-flex h-fit items-center rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: tone.bg, color: tone.color }}>{item.type || tone.label}</span>
                  <span className="font-medium text-slate-900">{normalizeText(item.title)}</span>
                  <span className="text-slate-600">{normalizeText(item.description)}</span>
                  <span className="truncate text-right text-[13px] text-slate-500">{normalizeText(item.meta)}</span>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && pagination.last_page > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-black/5 px-5 py-3">
            <p className="text-[12px] text-slate-500">{locale === 'ro' ? `Pagina ${pagination.page} din ${pagination.last_page} • ${pagination.total} înregistrări` : `Page ${pagination.page} of ${pagination.last_page} • ${pagination.total} records`}</p>
            <div className="flex items-center gap-2">
              <button type="button" className="icon-button disabled:opacity-50" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={pagination.page <= 1} title={locale === 'ro' ? 'Pagina anterioară' : 'Previous page'} aria-label={locale === 'ro' ? 'Pagina anterioară' : 'Previous page'}>←</button>
              <button type="button" className="icon-button disabled:opacity-50" onClick={() => setPage((prev) => Math.min(pagination.last_page, prev + 1))} disabled={pagination.page >= pagination.last_page} title={locale === 'ro' ? 'Pagina următoare' : 'Next page'} aria-label={locale === 'ro' ? 'Pagina următoare' : 'Next page'}>→</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
