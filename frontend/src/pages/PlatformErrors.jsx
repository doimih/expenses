import { useEffect, useMemo, useState } from 'react';
import { useLocale } from '../i18n/LocaleContext';
import api from '../services/api';

const PER_PAGE = 50;

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
  if (!value) return locale === 'ro' ? 'Nu am putut încărca erorile platformei.' : 'Could not load platform errors.';
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

function toneByLevel(level) {
  const key = String(level || 'error').toLowerCase();
  if (['critical', 'fatal', 'error'].includes(key)) return { bg: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', label: key };
  if (key.includes('warning') || key.includes('warn')) return { bg: 'rgba(245, 158, 11, 0.12)', color: '#d97706', label: key };
  return { bg: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', label: key };
}

export default function PlatformErrors() {
  const { locale } = useLocale();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, per_page: PER_PAGE, total: 0, last_page: 1 });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const { data } = await api.get(`/reports/platform-errors?month=${month}&page=${page}&per_page=${PER_PAGE}`);
        if (!cancelled) {
          setLogs(data?.logs || []);
          setPagination(data?.pagination || { page, per_page: PER_PAGE, total: (data?.logs || []).length, last_page: 1 });
        }
      } catch (requestError) {
        if (!cancelled) {
          setLogs([]);
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

  const filtered = useMemo(() => logs.filter((item) => {
    if (!query.trim()) return true;
    const haystack = `${normalizeText(item.exception_class)} ${normalizeText(item.message)} ${normalizeText(item.request_path)} ${normalizeText(item.user_email)} ${normalizeText(item.user_role)} ${normalizeText(item.context)} ${normalizeText(item.trace)}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  }), [logs, query]);

  return (
    <div className="space-y-4">
      <div className="app-panel px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="panel-label">{locale === 'ro' ? 'Platforma' : 'Platform'}</p>
            <h2 className="mt-1 text-[18px] font-medium text-slate-900">{locale === 'ro' ? 'Erori platformă' : 'Platform errors'}</h2>
            <p className="mt-1 text-[13px] text-slate-500">{locale === 'ro' ? 'Erori capturate global din excepțiile platformei.' : 'Globally captured platform exceptions.'}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input className="input w-[180px]" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
            <input className="input w-[260px]" placeholder={locale === 'ro' ? 'Caută în erori...' : 'Search errors...'} value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </div>
      </div>

      <div className="app-panel overflow-hidden">
        <div className="grid grid-cols-[170px_120px_1fr_1fr_180px] gap-3 border-b border-black/5 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
          <span>{locale === 'ro' ? 'Moment' : 'Timestamp'}</span>
          <span>{locale === 'ro' ? 'Nivel' : 'Level'}</span>
          <span>{locale === 'ro' ? 'Excepție' : 'Exception'}</span>
          <span>{locale === 'ro' ? 'Mesaj' : 'Message'}</span>
          <span className="text-right">{locale === 'ro' ? 'Detalii' : 'Details'}</span>
        </div>

        {loading ? (
          <div className="px-5 py-6 text-[14px] text-slate-500">{locale === 'ro' ? 'Se încarcă erorile platformei...' : 'Loading platform errors...'}</div>
        ) : error ? (
          <div className="px-5 py-6 text-[14px] text-[var(--danger)]">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-6 text-[14px] text-slate-500">{locale === 'ro' ? 'Nu există erori pentru filtrele selectate.' : 'No errors match the selected filters.'}</div>
        ) : (
          <div>
            {filtered.map((item, index) => {
              const tone = toneByLevel(item.level);
              const location = [item.request_method, item.request_path].filter(Boolean).join(' ') || (locale === 'ro' ? 'fără cale' : 'no path');
              const userLabel = item.user_email ? `${item.user_email}${item.user_role ? ` (${item.user_role})` : ''}` : (locale === 'ro' ? 'utilizator necunoscut' : 'unknown user');

              return (
                <div key={`${item.id || item.exception_class || 'error'}-${index}`} className="border-b border-black/5 px-5 py-4 text-[14px] last:border-b-0">
                  <div className="grid grid-cols-[170px_120px_1fr_1fr_180px] gap-3">
                    <span className="text-[13px] text-slate-600">{formatTimestamp(item.occurred_at, locale)}</span>
                    <span className="inline-flex h-fit items-center rounded-full px-2.5 py-1 text-[11px] font-medium uppercase" style={{ background: tone.bg, color: tone.color }}>{item.level || tone.label}</span>
                    <span className="font-medium text-slate-900">{normalizeText(item.exception_class)}</span>
                    <span className="text-slate-600">{normalizeText(item.message)}</span>
                    <span className="text-right text-[13px] text-slate-500">
                      <span className="block truncate">{location}</span>
                      <span className="block truncate text-[12px] text-slate-400">{userLabel}</span>
                    </span>
                  </div>

                  <details className="mt-3 rounded-xl border border-black/5 bg-slate-50 px-3 py-2">
                    <summary className="cursor-pointer text-[12px] font-medium text-slate-600">{locale === 'ro' ? 'Arată detaliile' : 'Show details'}</summary>
                    <div className="mt-3 space-y-3 text-[12px] text-slate-600">
                      <div className="grid gap-2 md:grid-cols-2">
                        <p><span className="font-medium text-slate-800">{locale === 'ro' ? 'Sursa' : 'Source'}:</span> {normalizeText(item.source)}</p>
                        <p><span className="font-medium text-slate-800">{locale === 'ro' ? 'Rută' : 'Route'}:</span> {normalizeText(item.route_name)}</p>
                        <p><span className="font-medium text-slate-800">{locale === 'ro' ? 'IP' : 'IP'}:</span> {normalizeText(item.ip_address)}</p>
                        <p><span className="font-medium text-slate-800">{locale === 'ro' ? 'Utilizator' : 'User'}:</span> {userLabel}</p>
                      </div>

                      <div>
                        <p className="mb-1 font-medium text-slate-800">{locale === 'ro' ? 'Context' : 'Context'}</p>
                        <pre className="overflow-x-auto rounded-lg bg-white p-3 text-[11px] leading-relaxed text-slate-500">{normalizeText(item.context)}</pre>
                      </div>

                      <div>
                        <p className="mb-1 font-medium text-slate-800">{locale === 'ro' ? 'Trace' : 'Trace'}</p>
                        <pre className="max-h-[220px] overflow-auto rounded-lg bg-white p-3 text-[11px] leading-relaxed text-slate-500">{normalizeText(item.trace)}</pre>
                      </div>
                    </div>
                  </details>
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
