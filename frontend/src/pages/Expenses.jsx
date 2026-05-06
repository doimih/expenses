import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';

const paymentOptions = ['Cash', 'Card', 'Revolut', 'PayPal'];

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function quarterTag(month) {
  const [year, mm] = month.split('-').map(Number);
  const quarter = Math.ceil(mm / 3);
  return `q${quarter}-${year}`;
}

function defaultDate(month) {
  const [year, mm] = month.split('-').map(Number);
  const today = new Date();
  const day = month === currentMonth() ? today.getDate() : 1;
  return `${String(day).padStart(2, '0')}/${String(mm).padStart(2, '0')}/${year}`;
}

function toApiDate(dateValue) {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(dateValue) ? dateValue.replace(/\//g, '.') : dateValue;
}

function formatMoney(value) {
  return `RON ${Number(value || 0).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr) {
  const [day, month, year] = dateStr.split('/');
  const date = new Date(`${year}-${month}-${day}`);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[date.getMonth()]} ${Number(day)}, ${year}`;
}

function emptyForm(month) {
  return {
    amount: '',
    category_id: '',
    date: defaultDate(month),
    notes: '',
    payment: 'Card',
    tags: [quarterTag(month)],
    tagInput: '',
    showAllCategories: false,
  };
}

function Label({ children }) {
  return <p className="text-[12px] font-semibold uppercase tracking-[0.07em] text-slate-500">{children}</p>;
}

function categoryColor(category) {
  return category?.color || '#ef4444';
}

export default function Expenses({ user }) {
  const [month, setMonth] = useState(currentMonth());
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm(month));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [allExpenses, setAllExpenses] = useState([]);
  const amountRef = useRef(null);

  const isAdmin = user?.role === 'superadmin';

  const load = async () => {
    try {
      const [categoriesResponse, expensesResponse] = await Promise.all([
        api.get('/categories'),
        api.get(`/expenses?month=${month}`),
      ]);
      setCategories(categoriesResponse.data || []);
      setAllExpenses(expensesResponse.data || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Could not load data.');
    }
  };

  useEffect(() => {
    load();
  }, [month]);

  const selectedCategory = useMemo(
    () => categories.find((item) => String(item.id) === String(form.category_id)) || categories[0],
    [categories, form.category_id],
  );

  const budgetData = useMemo(() => {
    const total = allExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const budget = 1200;
    const usedPercent = Math.min(100, Math.round((total / budget) * 100));
    return { total, budget, usedPercent, remaining: Math.max(0, budget - total) };
  }, [allExpenses]);

  const saveExpense = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.amount || Number(form.amount) <= 0) {
      setError('Amount is required.');
      return;
    }

    if (!form.category_id) {
      setError('Category is required.');
      return;
    }

    const payload = {
      category_id: Number(form.category_id),
      amount: Number(form.amount),
      description: form.notes,
      date: toApiDate(form.date),
    };

    try {
      await api.post('/expenses', payload);
      setSuccess('Expense saved successfully!');
      setForm(emptyForm(month));
      await load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to save expense.');
    }
  };

  const addTag = () => {
    const nextTag = form.tagInput.trim();
    if (!nextTag || form.tags.includes(nextTag)) {
      setForm((prev) => ({ ...prev, tagInput: '' }));
      return;
    }
    setForm((prev) => ({ ...prev, tags: [...prev.tags, nextTag], tagInput: '' }));
  };

  const removeTag = (tag) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((item) => item !== tag) }));
  };

  const onTagKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag();
    }
  };

  // Admin view: show list
  if (isAdmin) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-4 rounded-[20px] border border-black/5 bg-white px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="panel-label">Expenses</p>
            <h2 className="mt-1 text-[18px] font-medium text-slate-900">Manage monthly spend</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input className="input max-w-[180px]" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          </div>
        </div>

        <div className="app-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
            <h3 className="panel-title">Expenses for {month}</h3>
            <span className="text-[13px] text-slate-500">{allExpenses.length} rows</span>
          </div>
          <div>
            {allExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between gap-4 border-b border-black/5 px-5 py-4 last:border-b-0">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full text-[11px] font-medium" style={{ background: `${categoryColor(expense.category)}14`, color: categoryColor(expense.category) }}>
                    ◉
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{expense.description || expense.category?.name}</p>
                    <p className="truncate text-[13px] text-slate-500">{expense.category?.name} - {expense.date}</p>
                  </div>
                </div>
                <p className="font-medium text-slate-900">{formatMoney(expense.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // User view: form with live preview
  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left panel: Form */}
        <form onSubmit={saveExpense} className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Add expense</h1>
            <p className="mt-1 text-sm text-slate-500">{formatDate(form.date)} • {user?.first_name} {user?.last_name}</p>
          </div>

          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          {success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">{success}</div>}

          {/* Amount */}
          <div>
            <Label>Amount *</Label>
            <div className="mt-2 flex gap-2">
              <input
                ref={amountRef}
                className="input h-12 flex-1 text-2xl font-bold"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                required
              />
              <select className="input h-12 px-4 text-lg font-medium text-slate-600">
                <option>RON</option>
              </select>
            </div>
          </div>

          {/* Category */}
            <div>
              <Label>Category</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {categories.length > 5 ? (
                  <>
                    {categories.slice(0, 5).map((category) => {
                      const active = String(form.category_id) === String(category.id);
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, category_id: String(category.id) }))}
                          className="rounded-full px-4 py-2 text-sm font-medium transition border-2"
                          style={{
                            borderColor: category.color,
                            color: '#fff',
                            background: category.color,
                            opacity: active ? 1 : 0.7,
                          }}
                        >
                          {category.name}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, showAllCategories: !prev.showAllCategories }))}
                      className="rounded-full border-2 border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                    >
                      More
                    </button>
                    {form.showAllCategories && categories.slice(5).map((category) => {
                      const active = String(form.category_id) === String(category.id);
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, category_id: String(category.id) }))}
                          className="rounded-full px-4 py-2 text-sm font-medium transition border-2"
                          style={{
                            borderColor: category.color,
                            color: '#fff',
                            background: category.color,
                            opacity: active ? 1 : 0.7,
                          }}
                        >
                          {category.name}
                        </button>
                      );
                    })}
                  </>
                ) : (
                  categories.map((category) => {
                    const active = String(form.category_id) === String(category.id);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, category_id: String(category.id) }))}
                        className="rounded-full px-4 py-2 text-sm font-medium transition border-2"
                        style={{
                          borderColor: category.color,
                          color: '#fff',
                          background: category.color,
                          opacity: active ? 1 : 0.7,
                        }}
                      >
                        {category.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

          {/* Date & Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <div className="mt-2 flex gap-2">
                <input
                  className="input flex-1"
                  type="text"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                />
                <button type="button" className="rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-50 transition">
                  📅
                </button>
              </div>
            </div>
            <div>
              <Label>Payment Method</Label>
              <div className="mt-2 flex gap-1">
                {paymentOptions.map((option) => {
                  const active = form.payment === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, payment: option }))}
                      className="flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition"
                      style={{
                        borderColor: active ? '#6366f1' : '#ddd',
                        color: active ? '#6366f1' : '#666',
                        background: active ? '#eef0ff' : '#f5f4f0',
                      }}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700 font-medium"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-blue-400 hover:text-blue-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              className="input mt-2"
              type="text"
              placeholder="Add tag..."
              value={form.tagInput}
              onChange={(e) => setForm((prev) => ({ ...prev, tagInput: e.target.value }))}
              onKeyDown={onTagKeyDown}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {['+work', '+travel', '+recurring', '+client'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    const tag = preset.slice(1);
                    if (!form.tags.includes(tag)) {
                      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
                    }
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 transition"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Attachment */}
          <div>
            <Label>Attachment</Label>
            <div className="mt-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <svg className="mx-auto h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <p className="mt-2 text-sm text-slate-600">
                Drop receipt here or <a href="#" className="text-blue-600 hover:underline">click to browse</a>
              </p>
              <p className="text-xs text-slate-500">PNG, JPG, PDF - max 5MB</p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <textarea
              className="input mt-2 min-h-[120px] resize-none"
              placeholder="Any details about this expense..."
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setForm(emptyForm(month));
                setError('');
                setSuccess('');
              }}
              className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              ⋯ Duplicate
            </button>
            <button
              type="submit"
              className="ml-auto rounded-lg bg-blue-600 px-8 py-3 font-medium text-white hover:bg-blue-700 transition flex items-center gap-2"
            >
              <span>✓</span>
              <span>Save expense</span>
            </button>
          </div>
        </form>

        {/* Right panel: Live preview */}
        {form.amount && selectedCategory && (
          <div className="hidden lg:block sticky top-4 h-fit space-y-4">
            <div className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">LIVE PREVIEW</p>

              {/* Amount display */}
              <div className="mt-4">
                <p className="text-5xl font-bold text-slate-900">{formatMoney(form.amount)}</p>
                <p className="mt-2 text-sm text-slate-600">{formatDate(form.date)} • {selectedCategory.name}</p>
              </div>

              <div className="mt-6 space-y-4 border-t border-slate-200 pt-4">
                {/* Category */}
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Category</p>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium" style={{ background: `${selectedCategory.color}14`, color: selectedCategory.color }}>
                    <span className="text-base">●</span>
                    <span>{selectedCategory.name}</span>
                  </div>
                </div>

                {/* Payment */}
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Payment</p>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
                    <span>◎</span>
                    <span>{form.payment}</span>
                  </div>
                </div>

                {/* Tags */}
                {form.tags.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">Tags</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {form.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {form.notes && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">Notes</p>
                    <p className="mt-2 text-sm text-slate-700">{form.notes}</p>
                  </div>
                )}

                {/* Attachment */}
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Attachment</p>
                  <p className="mt-2 text-sm text-slate-500">None</p>
                </div>

                {/* Auto-suggested */}
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-sm font-semibold text-green-700 flex items-center gap-2">
                    <span>✓</span>
                    <span>Auto-suggested</span>
                  </p>
                  <p className="mt-1 text-xs text-green-600">Based on your last 14 expenses, this looks like <strong>{selectedCategory.name}</strong>. Category was pre-filled for you.</p>
                </div>

                {/* Budget by category */}
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Budget This Month</p>
                  <div className="mt-3 space-y-3">
                    <div>
                      <p className="flex items-center justify-between text-sm font-medium text-slate-900">
                        <span>{selectedCategory.name}</span>
                        <span>RON 1,036 / 1,200</span>
                      </p>
                      <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-red-500"
                          style={{ width: `${Math.min(100, (1036 / 1200) * 100)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-red-600 font-medium">86% used • RON 164 remaining</p>
                    </div>
                  </div>

                  {/* Overall budget */}
                  <div className="mt-4 pt-3 border-t border-slate-200">
                    <p className="flex items-center justify-between text-sm font-medium text-slate-900">
                      <span>Overall</span>
                      <span>RON 2,980 / 4,500</span>
                    </p>
                    <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{ width: `${Math.min(100, (2980 / 4500) * 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-green-600 font-medium">66% used • on track</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
