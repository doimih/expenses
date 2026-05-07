import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function toneByType(type) {
  const key = String(type || '').toLowerCase();
  if (key.includes('delete') || key.includes('error')) {
    return {
      bg: 'rgba(239, 68, 68, 0.1)',
      color: '#dc2626',
      label: 'danger',
    };
  }

  if (key.includes('create') || key.includes('login') || key.includes('register')) {
    return {
      bg: 'rgba(22, 163, 74, 0.1)',
      color: '#16a34a',
      label: 'success',
    };
  }

  return {
    bg: 'rgba(99, 102, 241, 0.1)',
    color: '#6366f1',
    label: 'info',
  };
}

function formatTimestamp(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('ro-RO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SystemLogs() {
  const [month, setMonth] = useState(currentMonth());
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const { data } = await api.get(`/reports/admin-overview?month=${month}`);
        if (!cancelled) {
          setActivity(data?.activity || []);
        }
      } catch (requestError) {
        if (!cancelled) {
          setActivity([]);
          setError(requestError?.response?.data?.message || 'Nu am putut încărca log-urile de sistem.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [month]);

  const typeOptions = useMemo(() => {
    const types = new Set(activity.map((item) => item.type).filter(Boolean));
    return ['all', ...Array.from(types)];
  }, [activity]);

  const filtered = useMemo(() => {
    return activity.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) {
        return false;
      }

      if (!query.trim()) {
        return true;
      }

      const haystack = `${item.title || ''} ${item.description || ''} ${item.meta || ''}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    });
  }, [activity, query, typeFilter]);

  return (
    <div className="space-y-4">
      <div className="app-panel px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="panel-label">System</p>
            <h2 className="mt-1 text-[18px] font-medium text-slate-900">System Log</h2>
            <p className="mt-1 text-[13px] text-slate-500">Audit events from platform activity.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              className="input w-[180px]"
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            />
            <select
              className="input w-[180px]"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {type === 'all' ? 'Toate tipurile' : type}
                </option>
              ))}
            </select>
            <input
              className="input w-[260px]"
              placeholder="Caută în log-uri..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="app-panel overflow-hidden">
        <div className="grid grid-cols-[170px_130px_1fr_1fr_140px] gap-3 border-b border-black/5 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
          <span>Timestamp</span>
          <span>Type</span>
          <span>Title</span>
          <span>Description</span>
          <span className="text-right">Meta</span>
        </div>

        {loading ? (
          <div className="px-5 py-6 text-[14px] text-slate-500">Loading system logs...</div>
        ) : error ? (
          <div className="px-5 py-6 text-[14px] text-[var(--danger)]">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-6 text-[14px] text-slate-500">Nu există evenimente pentru filtrele selectate.</div>
        ) : (
          <div>
            {filtered.map((item, index) => {
              const tone = toneByType(item.type);
              return (
                <div
                  key={`${item.type || 'event'}-${index}`}
                  className="grid grid-cols-[170px_130px_1fr_1fr_140px] gap-3 border-b border-black/5 px-5 py-4 text-[14px] last:border-b-0"
                >
                  <span className="text-[13px] text-slate-600">{formatTimestamp(item.timestamp)}</span>
                  <span
                    className="inline-flex h-fit items-center rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{ background: tone.bg, color: tone.color }}
                  >
                    {item.type || tone.label}
                  </span>
                  <span className="font-medium text-slate-900">{item.title || '-'}</span>
                  <span className="text-slate-600">{item.description || '-'}</span>
                  <span className="truncate text-right text-[13px] text-slate-500">{item.meta || '-'}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
