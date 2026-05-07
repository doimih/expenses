import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

function formatMoney(value) {
  return `RON ${Number(value || 0).toLocaleString('ro-RO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr) {
  const s = String(dateStr || '');
  // accepts yyyy-mm-dd or dd.mm.yyyy or dd/mm/yyyy
  let year, month, day;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    [year, month, day] = s.split('-');
  } else {
    [day, month, year] = s.split(/[/.]/) || ['', '', ''];
  }
  // Return DD.MM.YYYY format
  return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;
}

function toApiDate(dateStr) {
  const s = String(dateStr || '').trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return s;
  }
  const match = s.match(/^(\d{2})[./](\d{2})[./](\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  return s;
}

function getDateParts(dateStr) {
  const s = String(dateStr || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [year, month] = s.split('-').map(Number);
    return { year, month };
  }
  const match = s.match(/^(\d{2})[./](\d{2})[./](\d{4})$/);
  if (match) {
    return { year: Number(match[3]), month: Number(match[2]) };
  }
  return null;
}

function currentYear() {
  return new Date().getFullYear();
}

function currentMonthNum() {
  return new Date().getMonth() + 1;
}

const monthNames = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
];

function EditModal({ expense, categories, onClose, onSaved }) {
  const [form, setForm] = useState({
    amount: expense.amount,
    category_id: String(expense.category?.id || ''),
    description: expense.description || '',
    date: formatDate(expense.date || ''),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.put(`/expenses/${expense.id}`, {
        amount: Number(form.amount),
        category_id: Number(form.category_id),
        description: form.description,
        date: toApiDate(form.date),
      });
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message || 'Eroare la salvare.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-[#d7d8d3] bg-[#f4f4f1] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#d7d8d3] px-5 py-4">
          <h2 className="text-[17px] font-semibold text-slate-900">Editează cheltuiala</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-5 py-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
          )}

          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-[0.07em] text-slate-500 mb-1">Sumă (RON)</label>
            <input
              className="h-[44px] w-full rounded-lg border border-[#cfd2dc] bg-white px-3 text-[16px] text-slate-900 outline-none focus:border-[#6366f1]"
              type="number"
              step="0.01"
              min="0"
              required
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-[0.07em] text-slate-500 mb-1">Categorie</label>
            <select
              className="h-[44px] w-full rounded-lg border border-[#cfd2dc] bg-white px-3 text-[15px] text-slate-900 outline-none focus:border-[#6366f1]"
              value={form.category_id}
              onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
              required
            >
              <option value="">Selectează categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-[0.07em] text-slate-500 mb-1">Descriere</label>
            <input
              className="h-[44px] w-full rounded-lg border border-[#cfd2dc] bg-white px-3 text-[15px] text-slate-900 outline-none focus:border-[#6366f1]"
              type="text"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Descriere cheltuială..."
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-[0.07em] text-slate-500 mb-1">Dată</label>
            <input
              className="h-[44px] w-full rounded-lg border border-[#cfd2dc] bg-white px-3 text-[15px] text-slate-900 outline-none focus:border-[#6366f1]"
              type="text"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value.replace(/\//g, '.') }))}
              placeholder="dd.mm.yyyy"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#cfd2dc] bg-white px-4 py-2 text-[14px] font-medium text-slate-700 hover:bg-[#f1f3ef]"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl border border-[#2f63f3] bg-[#3a6bff] px-5 py-2 text-[14px] font-semibold text-white hover:bg-[#2f63f3] disabled:opacity-60"
            >
              {saving ? 'Se salvează...' : 'Salvează'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ExpenseList({ user }) {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [year, setYear] = useState(currentYear());
  const [month, setMonth] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const [editingExpense, setEditingExpense] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const isReadOnly = user?.role === 'visitor';
  const tableGridClass = isReadOnly
    ? 'md:grid-cols-[minmax(0,260px)_110px_150px]'
    : 'md:grid-cols-[minmax(0,260px)_110px_150px_1fr]';

  const load = async () => {
    setLoading(true);
    try {
      const [catRes, expRes] = await Promise.all([
        api.get('/categories'),
        api.get('/expenses'),
      ]);
      setCategories(catRes.data || []);
      setExpenses(expRes.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const yearOptions = useMemo(() => {
    const years = new Set(
      expenses.map((e) => {
        const parts = getDateParts(e.date);
        return parts?.year ?? null;
      }).filter(Boolean),
    );
    const arr = Array.from(years).sort((a, b) => b - a);
    if (!arr.includes(currentYear())) arr.unshift(currentYear());
    return arr;
  }, [expenses]);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const parts = getDateParts(e.date);
      const expYear = parts?.year ?? null;
      const expMonth = parts?.month ?? null;

      if (expYear !== year) return false;
      if (month !== 0 && expMonth !== month) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const inDesc = (e.description || '').toLowerCase().includes(q);
        const inCat = (e.category?.name || '').toLowerCase().includes(q);
        if (!inDesc && !inCat) return false;
      }
      return true;
    });
  }, [expenses, year, month, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [year, month, search]);

  const total = useMemo(
    () => filtered.reduce((s, e) => s + Number(e.amount || 0), 0),
    [filtered],
  );

  const handleDelete = async (id) => {
    if (!window.confirm('Ștergi această cheltuială?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch {
      alert('Eroare la ștergere.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1024px] space-y-4 pb-28 md:pb-6">
      {!isReadOnly && editingExpense && (
        <EditModal
          expense={editingExpense}
          categories={categories}
          onClose={() => setEditingExpense(null)}
          onSaved={() => {
            setEditingExpense(null);
            load();
          }}
        />
      )}

      <div className="app-panel overflow-hidden">
        {/* Header + Filters */}
        <div className="border-b border-black/5 px-5 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="panel-title">Lista cheltuieli</h3>
              <select
                className="expense-filter-select h-[34px] rounded-lg border px-3 text-[13px] font-semibold outline-none"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-[12px] text-slate-500">Filtrare după an, lună și descriere.</p>

            <div className="-mx-1 mt-3 overflow-x-auto pb-1">
              <div className="flex min-w-max items-center gap-2 px-1">
              <button
                type="button"
                onClick={() => setMonth(0)}
                className={`expense-month-chip rounded-lg border px-3 py-2 text-[12px] font-semibold leading-none transition ${month === 0 ? 'expense-month-chip-active' : ''}`}
              >
                Toate
              </button>
              {monthNames.map((name, index) => {
                const value = index + 1;
                const isActive = month === value;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setMonth(value)}
                    className={`expense-month-chip rounded-lg border px-3 py-2 text-[12px] font-semibold leading-none transition ${isActive ? 'expense-month-chip-active shadow-[inset_0_0_0_1px_rgba(79,70,229,0.08)]' : ''}`}
                  >
                    {name}
                  </button>
                );
              })}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <input
              className="input w-full sm:max-w-[340px]"
              type="text"
              placeholder="Caută descriere..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <span className="w-fit rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-[13px] font-medium text-[var(--accent)]">
              Total: {formatMoney(total)}
            </span>
          </div>
        </div>

        {/* Table header */}
        <div className={`hidden md:grid ${tableGridClass} items-center gap-3 border-b border-black/5 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500`}>
          <span>Cheltuială</span>
          <span>Sumă</span>
          <span>Categorie</span>
          {!isReadOnly && <span className="text-right">Acțiuni</span>}
        </div>

        {/* Rows */}
        <div>
          {loading ? (
            <div className="px-5 py-8 text-[14px] text-slate-500">Se încarcă...</div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-8 text-[14px] text-slate-500">
              Nu există cheltuieli pentru filtrele selectate.
            </div>
          ) : (
            paginated.map((expense) => (
              <div
                key={expense.id}
                className={`border-b border-black/5 px-4 py-3 text-[14px] last:border-b-0 hover:bg-black/[0.015] md:grid md:px-5 ${tableGridClass} md:items-center md:gap-3`}
              >
                <div className="flex items-start justify-between gap-3 md:contents">
                  <div className="min-w-0 flex-1 md:min-w-0">
                    <div className="flex items-start justify-between gap-3 md:block">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 md:font-medium">
                          {expense.description || `${expense.category?.name || 'Cheltuială'}`}
                        </p>
                        <p className="mt-0.5 text-[12px] text-slate-400">{formatDate(expense.date)}</p>
                      </div>
                      <span className="shrink-0 text-right font-semibold text-slate-900 md:hidden">
                        {formatMoney(expense.amount)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-3 md:hidden">
                      <div className="flex min-w-0 items-center gap-1.5">
                        {expense.category?.color && (
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: expense.category.color }}
                          />
                        )}
                        <span className="truncate text-[13px] text-slate-600">
                          {expense.category?.name || '—'}
                        </span>
                      </div>

                      {!isReadOnly && (
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            title="Editează"
                            onClick={() => setEditingExpense(expense)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] transition"
                          >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            title="Șterge"
                            disabled={deletingId === expense.id}
                            onClick={() => handleDelete(expense.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition disabled:opacity-40"
                          >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="hidden font-semibold text-slate-900 md:inline">
                    {formatMoney(expense.amount)}
                  </span>

                  <div className="hidden min-w-0 items-center gap-1.5 md:flex">
                    {expense.category?.color && (
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: expense.category.color }}
                      />
                    )}
                    <span className="truncate text-[13px] text-slate-600">
                      {expense.category?.name || '—'}
                    </span>
                  </div>

                  {!isReadOnly && (
                    <div className="hidden items-center justify-end gap-1 md:flex">
                    <button
                      type="button"
                      title="Editează"
                      onClick={() => setEditingExpense(expense)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] transition"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      title="Șterge"
                      disabled={deletingId === expense.id}
                      onClick={() => handleDelete(expense.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition disabled:opacity-40"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-black/5 px-5 py-3">
            <span className="text-[13px] text-slate-500">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} din {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-stone-50 disabled:opacity-40"
              >
                ← Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === '...' ? (
                    <span key={`dots-${idx}`} className="px-1 text-slate-400">…</span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`min-w-[32px] rounded-lg border px-2 py-1.5 text-[13px] font-medium transition ${
                        p === page
                          ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                          : 'border-black/10 bg-white text-slate-700 hover:bg-stone-50'
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-stone-50 disabled:opacity-40"
              >
                Următor →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
