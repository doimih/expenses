import { useEffect, useMemo, useState } from 'react';
import { IconPencil, IconTrash, IconX } from '@tabler/icons-react';
import { useLocale } from '../i18n/LocaleContext';
import api from '../services/api';

function formatMoney(value, localeCode = 'ro-RO') {
  return `RON ${Number(value || 0).toLocaleString(localeCode, {
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
  const { locale } = useLocale();
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
      setError(err?.response?.data?.message || (locale === 'ro' ? 'Eroare la salvare.' : 'Save failed.'));
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
          <h2 className="text-[17px] font-semibold text-slate-900">{locale === 'ro' ? 'Editează cheltuiala' : 'Edit expense'}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <IconX className="h-5 w-5" stroke={2} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-5 py-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
          )}

          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-[0.07em] text-slate-500 mb-1">{locale === 'ro' ? 'Sumă (RON)' : 'Amount (RON)'}</label>
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
            <label className="block text-[12px] font-semibold uppercase tracking-[0.07em] text-slate-500 mb-1">{locale === 'ro' ? 'Categorie' : 'Category'}</label>
            <select
              className="h-[44px] w-full rounded-lg border border-[#cfd2dc] bg-white px-3 text-[15px] text-slate-900 outline-none focus:border-[#6366f1]"
              value={form.category_id}
              onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
              required
            >
              <option value="">{locale === 'ro' ? 'Selectează categoria' : 'Select category'}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-[0.07em] text-slate-500 mb-1">{locale === 'ro' ? 'Descriere' : 'Description'}</label>
            <input
              className="h-[44px] w-full rounded-lg border border-[#cfd2dc] bg-white px-3 text-[15px] text-slate-900 outline-none focus:border-[#6366f1]"
              type="text"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder={locale === 'ro' ? 'Descriere cheltuială...' : 'Expense description...'}
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-[0.07em] text-slate-500 mb-1">{locale === 'ro' ? 'Dată' : 'Date'}</label>
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
              {locale === 'ro' ? 'Anulează' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl border border-[#2f63f3] bg-[#3a6bff] px-5 py-2 text-[14px] font-semibold text-white hover:bg-[#2f63f3] disabled:opacity-60"
            >
              {saving ? (locale === 'ro' ? 'Se salvează...' : 'Saving...') : (locale === 'ro' ? 'Salvează' : 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ExpenseList({ user }) {
  const { locale } = useLocale();
  const numberLocale = locale === 'ro' ? 'ro-RO' : 'en-US';
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
  const monthNames = locale === 'ro'
    ? ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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
              <h3 className="panel-title">{locale === 'ro' ? 'Lista cheltuieli' : 'Expense list'}</h3>
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
            <p className="mt-1 text-[12px] text-slate-500">{locale === 'ro' ? 'Filtrare după an, lună și descriere.' : 'Filter by year, month, and description.'}</p>

            <div className="-mx-1 mt-3 overflow-x-auto pb-1">
              <div className="flex min-w-max items-center gap-2 px-1">
              <button
                type="button"
                onClick={() => setMonth(0)}
                className={`expense-month-chip rounded-lg border px-3 py-2 text-[12px] font-semibold leading-none transition ${month === 0 ? 'expense-month-chip-active' : ''}`}
              >
                {locale === 'ro' ? 'Toate' : 'All'}
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
              placeholder={locale === 'ro' ? 'Caută descriere...' : 'Search description...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <span className="w-fit rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-[13px] font-medium text-[var(--accent)]">
              {locale === 'ro' ? 'Total' : 'Total'}: {formatMoney(total, numberLocale)}
            </span>
          </div>
        </div>

        {/* Table header */}
        <div className={`hidden md:grid ${tableGridClass} items-center gap-3 border-b border-black/5 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500`}>
          <span>{locale === 'ro' ? 'Cheltuială' : 'Expense'}</span>
          <span>{locale === 'ro' ? 'Sumă' : 'Amount'}</span>
          <span>{locale === 'ro' ? 'Categorie' : 'Category'}</span>
          {!isReadOnly && <span className="text-right">{locale === 'ro' ? 'Acțiuni' : 'Actions'}</span>}
        </div>

        {/* Rows */}
        <div>
          {loading ? (
            <div className="px-5 py-8 text-[14px] text-slate-500">{locale === 'ro' ? 'Se încarcă...' : 'Loading...'}</div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-8 text-[14px] text-slate-500">
              {locale === 'ro' ? 'Nu există cheltuieli pentru filtrele selectate.' : 'No expenses match the selected filters.'}
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
                          {expense.description || `${expense.category?.name || (locale === 'ro' ? 'Cheltuială' : 'Expense')}`}
                        </p>
                        <p className="mt-0.5 text-[12px] text-slate-400">{formatDate(expense.date)}</p>
                      </div>
                      <span className="shrink-0 text-right font-semibold text-slate-900 md:hidden">
                        {formatMoney(expense.amount, numberLocale)}
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
                            title={locale === 'ro' ? 'Editează' : 'Edit'}
                            onClick={() => setEditingExpense(expense)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] transition"
                          >
                            <IconPencil className="h-4 w-4" stroke={1.8} aria-hidden="true" />
                          </button>

                          <button
                            type="button"
                            title={locale === 'ro' ? 'Șterge' : 'Delete'}
                            disabled={deletingId === expense.id}
                            onClick={() => handleDelete(expense.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition disabled:opacity-40"
                          >
                            <IconTrash className="h-4 w-4" stroke={1.8} aria-hidden="true" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="hidden font-semibold text-slate-900 md:inline">
                    {formatMoney(expense.amount, numberLocale)}
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
                      title={locale === 'ro' ? 'Editează' : 'Edit'}
                      onClick={() => setEditingExpense(expense)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] transition"
                    >
                      <IconPencil className="h-4 w-4" stroke={1.8} aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      title={locale === 'ro' ? 'Șterge' : 'Delete'}
                      disabled={deletingId === expense.id}
                      onClick={() => handleDelete(expense.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition disabled:opacity-40"
                    >
                      <IconTrash className="h-4 w-4" stroke={1.8} aria-hidden="true" />
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
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} {locale === 'ro' ? 'din' : 'of'} {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-stone-50 disabled:opacity-40"
              >
                {locale === 'ro' ? '← Anterior' : '← Previous'}
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
                {locale === 'ro' ? 'Următor →' : 'Next →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
