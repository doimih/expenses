import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../services/api';
import PieChart from '../components/charts/PieChart';
import { useLocale } from '../i18n/LocaleContext';
import {
  IconCalendarEvent,
  IconCash,
  IconCopy,
  IconCreditCard,
  IconDeviceFloppy,
  IconSparkles,
  IconTag,
  IconX,
} from '@tabler/icons-react';

const LAST_EXPENSE_DATE_KEY = 'expenses:last-date';

const CATEGORY_STYLES = [
  { bg: '#fff0ef', border: '#ef4444', text: '#ef4444' },
  { bg: '#ebfbef', border: '#22c55e', text: '#16a34a' },
  { bg: '#fff5e8', border: '#f59e0b', text: '#d97706' },
  { bg: '#f1efff', border: '#8b5cf6', text: '#6366f1' },
  { bg: '#eef9ff', border: '#38bdf8', text: '#0ea5e9' },
  { bg: '#f3f0ea', border: '#a8a29e', text: '#78716c' },
];

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function readLastExpenseDate() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(LAST_EXPENSE_DATE_KEY) || '';
}

function monthFromDisplayDate(dateValue) {
  const match = String(dateValue || '').trim().match(/^(\d{2})[./](\d{2})[./](\d{4})$/);
  if (!match) return '';
  return `${match[3]}-${match[2]}`;
}

function quarterTag(month) {
  const [year, mm] = month.split('-').map(Number);
  const quarter = Math.ceil(mm / 3);
  return `q${quarter}-${year}`;
}

function defaultDate(month) {
  const storedDate = readLastExpenseDate();
  if (storedDate) {
    return storedDate;
  }

  const [year, mm] = month.split('-').map(Number);
  const today = new Date();
  const day = month === currentMonth() ? today.getDate() : 1;
  return `${String(day).padStart(2, '0')}.${String(mm).padStart(2, '0')}.${year}`;
}

function inputDateToApi(dateValue) {
  const match = String(dateValue || '').trim().match(/^(\d{2})[./](\d{2})[./](\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  return dateValue;
}

function apiDateToDisplay(dateValue) {
  const match = String(dateValue || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return '';
  return `${match[3]}.${match[2]}.${match[1]}`;
}

function formatDateInput(value) {
  const raw = String(value || '');
  // When dots are already present, treat each segment independently
  // so editing the day won't corrupt month/year digits.
  if (raw.includes('.')) {
    const parts = raw.split('.');
    const dd = parts[0].replace(/\D/g, '').slice(0, 2);
    const mm = (parts[1] || '').replace(/\D/g, '').slice(0, 2);
    const yy = (parts[2] || '').replace(/\D/g, '').slice(0, 4);
    if (!mm && !yy) return dd;
    if (!yy) return `${dd}.${mm}`;
    return `${dd}.${mm}.${yy}`;
  }
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

function formatMoney(value, numberLocale = 'ro-RO') {
  return `LEI ${Number(value || 340).toLocaleString(numberLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatHeaderDate(dateStr, locale = 'ro') {
  const match = String(dateStr || '').match(/^(\d{2})[./](\d{2})[./](\d{4})$/);
  if (!match) return '';
  const date = new Date(`${match[3]}-${match[2]}-${match[1]}`);
  return date.toLocaleDateString(locale === 'ro' ? 'ro-RO' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatPreviewDate(dateStr, locale = 'ro') {
  const match = String(dateStr || '').match(/^(\d{2})[./](\d{2})[./](\d{4})$/);
  if (!match) return '';
  const date = new Date(`${match[3]}-${match[2]}-${match[1]}`);
  return date.toLocaleDateString(locale === 'ro' ? 'ro-RO' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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
    categoryInput: '',
  };
}

function Label({ children }) {
  return <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#8f8a7a]">{children}</p>;
}

function categoryTone(category, index) {
  if (category?.color) {
    return {
      bg: `${category.color}12`,
      border: category.color,
      text: category.color,
    };
  }

  return CATEGORY_STYLES[index % CATEGORY_STYLES.length];
}

function iconSquare(color) {
  return (
    <span className="inline-flex h-4 w-4 items-center justify-center" style={{ color }}>
      <IconSparkles size={14} stroke={1.8} aria-hidden="true" />
    </span>
  );
}

function semanticIcon(kind, color) {
  if (kind === 'category') {
    return (
      <span className="inline-flex h-4 w-4 items-center justify-center" style={{ color }}>
        <IconTag size={14} stroke={1.8} aria-hidden="true" />
      </span>
    );
  }

  if (kind === 'cash') {
    return (
      <span className="inline-flex h-4 w-4 items-center justify-center" style={{ color }}>
        <IconCash size={14} stroke={1.8} aria-hidden="true" />
      </span>
    );
  }

  if (kind === 'card') {
    return (
      <span className="inline-flex h-4 w-4 items-center justify-center" style={{ color }}>
        <IconCreditCard size={14} stroke={1.8} aria-hidden="true" />
      </span>
    );
  }

  return iconSquare(color);
}

function actionIcon(kind, color) {
  if (kind === 'cancel') {
    return (
      <span className="inline-flex h-4 w-4 items-center justify-center" style={{ color }}>
        <IconX size={14} stroke={1.8} aria-hidden="true" />
      </span>
    );
  }

  if (kind === 'duplicate') {
    return (
      <span className="inline-flex h-4 w-4 items-center justify-center" style={{ color }}>
        <IconCopy size={14} stroke={1.8} aria-hidden="true" />
      </span>
    );
  }

  return (
    <span className="inline-flex h-4 w-4 items-center justify-center" style={{ color }}>
      <IconDeviceFloppy size={14} stroke={1.8} aria-hidden="true" />
    </span>
  );
}

function KeyBadge({ label }) {
  return (
    <span className="inline-flex min-w-[28px] items-center justify-center rounded-md border border-[#d8d1c6] bg-[#f8f6f1] px-2 py-0.5 text-[11px] font-semibold text-[#5e5a50]">
      {label}
    </span>
  );
}

function AddCategoryModal({ initialName, initialColor, onClose, onSubmit, saving, locale }) {
  const colorRef = useRef(null);
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  useEffect(() => {
    setColor(initialColor);
  }, [initialColor]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4" onClick={onClose}>
      <div className="w-full max-w-[520px] rounded-[28px] border border-[#ddd5ca] bg-[#faf7f1] p-5 shadow-[0_24px_60px_rgba(32,24,15,0.18)]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#8f8a7a]">{locale === 'ro' ? 'Categorie noua' : 'New category'}</p>
            <h2 className="mt-1 text-[24px] font-semibold text-[#2e2a24]">{locale === 'ro' ? 'Adauga categorie' : 'Add category'}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-[#8b8578] transition hover:bg-black/5" aria-label={locale === 'ro' ? 'Inchide fereastra' : 'Close modal'}>
            <IconX size={16} stroke={2} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 flex items-start gap-3">
          <input
            autoFocus
            className="h-[54px] flex-1 rounded-2xl border border-[#d7d2c8] bg-white px-4 text-[17px] text-[#2d2922] outline-none"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={locale === 'ro' ? 'Nume categorie' : 'Category name'}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && name.trim()) {
                event.preventDefault();
                onSubmit(name.trim(), color);
              }
            }}
          />

          <button
            type="button"
            onClick={() => colorRef.current?.click()}
            className="flex h-[54px] w-[54px] items-center justify-center rounded-2xl border border-[#d7d2c8] bg-white"
            title={locale === 'ro' ? 'Alege culoarea' : 'Pick color'}
            style={{ color }}
          >
            <span className="h-6 w-6 rounded-full border border-black/10" style={{ backgroundColor: color }} />
          </button>
          <input
            ref={colorRef}
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="sr-only"
          />
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-2xl border border-[#d7d2c8] bg-white px-5 py-3 text-[15px] font-medium text-[#37332c]">
            {locale === 'ro' ? 'Anuleaza' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => onSubmit(name.trim(), color)}
            disabled={!name.trim() || saving}
            className="rounded-2xl bg-[#6366f1] px-5 py-3 text-[15px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (locale === 'ro' ? 'Salvare...' : 'Saving...') : (locale === 'ro' ? 'Adauga categorie' : 'Add category')}
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentPill({ active, label, value, onClick }) {
  const iconKind = value.toLowerCase() === 'cash' ? 'cash' : 'card';

  return (
    <button
      tabIndex={-1}
      type="button"
      onClick={onClick}
      className="flex h-[52px] items-center justify-center gap-2 rounded-xl border bg-white px-3 text-[15px] font-medium transition"
      style={{
        borderColor: active ? '#6366f1' : '#d7d2c8',
        color: active ? '#6366f1' : '#6b665d',
        boxShadow: active ? '0 0 0 1px rgba(99, 102, 241, 0.15) inset' : 'none',
      }}
    >
      {semanticIcon(iconKind, active ? '#818cf8' : '#a8a29e')}
      <span>{label}</span>
    </button>
  );
}

function TopTabs({ dashboardPath, reportsPath }) {
  const tabs = [
    { to: '/expenses', label: 'Expenses' },
    { to: dashboardPath, label: 'Dashboard' },
    { to: reportsPath, label: 'Reports' },
    { to: '/expenses', label: 'Add expense', forceActive: true },
  ];

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#dbd5cb] px-5 py-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <NavLink
            key={`${tab.to}-${tab.label}`}
            to={tab.to}
            className={({ isActive }) => {
              const active = tab.forceActive ? true : isActive;
              return `inline-flex min-w-[110px] items-center justify-center gap-2 rounded-xl border px-4 py-3 text-[15px] font-medium transition ${active ? 'border-[#cfc8ff] bg-[#efefff] text-[#6366f1]' : 'border-[#d8d1c6] bg-[#fbfaf7] text-[#3f3a33] hover:bg-white'}`;
            }}
          >
            {iconSquare(tab.label === 'Add expense' ? '#818cf8' : '#b8b2a7')}
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="grid h-10 w-10 place-items-center rounded-full bg-[#6c63ff] text-sm font-semibold text-white">
        AP
      </div>
    </div>
  );
}

export default function Expenses({ user }) {
  const { locale } = useLocale();
  const ro = locale === 'ro';
  const numberLocale = ro ? 'ro-RO' : 'en-US';
  const paymentOptions = ro
    ? [{ value: 'Cash', label: 'Numerar' }, { value: 'Card', label: 'Card' }]
    : [{ value: 'Cash', label: 'Cash' }, { value: 'Card', label: 'Card' }];
  const presetTags = ro ? ['+ munca', '+ deplasare', '+ recurent', '+ client'] : ['+ work', '+ travel', '+ recurring', '+ client'];
  const navigate = useNavigate();
  const isVisitor = user?.role === 'visitor';
  const datePickerRef = useRef(null);
  const dateTextRef = useRef(null);
  const dateCursorRef = useRef(null);
  const amountInputRef = useRef(null);
  const notesInputRef = useRef(null);
  const [month, setMonth] = useState(() => monthFromDisplayDate(readLastExpenseDate()) || currentMonth());
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm(month));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [allExpenses, setAllExpenses] = useState([]);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState(0);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_STYLES[0].border);
  const [savingCategory, setSavingCategory] = useState(false);

  const isAdmin = user?.role === 'superadmin';
  const dashboardPath = isAdmin ? '/' : '/dashboard';
  const reportsPath = isAdmin ? '/expense-list' : '/dashboard';

  useEffect(() => {
    async function load() {
      try {
        const [categoriesResponse, expensesResponse] = await Promise.all([
          api.get('/categories'),
          api.get(`/expenses?month=${month}`),
        ]);

        const nextCategories = categoriesResponse.data || [];
        setCategories(nextCategories);
        setAllExpenses(expensesResponse.data || []);

        if (!form.category_id && nextCategories[0]) {
          setForm((prev) => ({
            ...prev,
            category_id: String(nextCategories[0].id),
          }));
        }
      } catch (loadError) {
        console.error('Error loading data:', loadError);
        setError(ro ? 'Nu s-au putut incarca datele.' : 'Could not load data.');
      }
    }

    load();
  }, [month]);

  const selectedCategory = useMemo(
    () => categories.find((item) => String(item.id) === String(form.category_id)) || categories[0] || null,
    [categories, form.category_id],
  );

  const matchingCategory = useMemo(() => {
    const query = form.categoryInput.trim().toLowerCase();
    if (!query) return null;
    return categories.find((item) => item.name.toLowerCase() === query)
      || categories.find((item) => item.name.toLowerCase().includes(query))
      || null;
  }, [categories, form.categoryInput]);

  const categorySuggestions = useMemo(() => {
    const query = form.categoryInput.trim().toLowerCase();
    if (query.length < 3) return [];

    return categories
      .filter((item) => item.name.toLowerCase().includes(query))
      .sort((left, right) => left.name.localeCompare(right.name))
      .slice(0, 8);
  }, [categories, form.categoryInput]);

  const exactCategoryMatch = useMemo(() => {
    const query = form.categoryInput.trim().toLowerCase();
    if (!query) return null;
    return categories.find((item) => item.name.toLowerCase() === query) || null;
  }, [categories, form.categoryInput]);

  const showCreateCategoryButton = !isVisitor && form.categoryInput.trim().length > 0 && !matchingCategory && categorySuggestions.length === 0;

  useEffect(() => {
    setHighlightedSuggestionIndex(0);
  }, [form.categoryInput]);

  useEffect(() => {
    if (categorySuggestions.length === 0) {
      setShowCategorySuggestions(false);
    }
  }, [categorySuggestions.length]);

  const categorySpendData = useMemo(() => {
    const totals = {};
    for (const expense of allExpenses) {
      const name = expense.category?.name || 'Other';
      const color = expense.category?.color || '#a8a29e';
      if (!totals[name]) totals[name] = { amount: 0, color };
      totals[name].amount += Number(expense.amount || 0);
    }
    const sorted = Object.entries(totals)
      .sort(([, a], [, b]) => b.amount - a.amount)
      .slice(0, 8);
    return {
      chartData: {
        labels: sorted.map(([name]) => name),
        datasets: [{
          data: sorted.map(([, v]) => v.amount),
          backgroundColor: sorted.map(([, v]) => v.color),
          borderWidth: 0,
        }],
      },
      topList: sorted,
      total: sorted.reduce((s, [, v]) => s + v.amount, 0),
    };
  }, [allExpenses]);

  const latestFiveExpenses = useMemo(() => {
    return [...allExpenses]
      .sort((left, right) => {
        const leftDate = new Date(left.date || left.created_at || 0).getTime();
        const rightDate = new Date(right.date || right.created_at || 0).getTime();

        if (rightDate !== leftDate) {
          return rightDate - leftDate;
        }

        return Number(right.id || 0) - Number(left.id || 0);
      })
      .slice(0, 5);
  }, [allExpenses]);

  const saveExpense = async (event) => {
    event.preventDefault();

    if (isVisitor) {
      setError(ro ? 'Contul de vizitator este doar pentru citire.' : 'Visitor account is read-only.');
      return;
    }

    setError('');
    setSuccess('');

    if (!form.amount || Number(form.amount) <= 0) {
      setError(ro ? 'Suma este obligatorie.' : 'Amount is required.');
      return;
    }

    if (!form.category_id) {
      setError(ro ? 'Categoria este obligatorie.' : 'Category is required.');
      return;
    }

    try {
      const nextMonth = monthFromDisplayDate(form.date) || month;

      await api.post('/expenses', {
        category_id: Number(form.category_id),
        amount: Number(form.amount),
        description: form.notes,
        date: inputDateToApi(form.date),
      });

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LAST_EXPENSE_DATE_KEY, form.date);
      }

      setSuccess(ro ? 'Cheltuiala a fost salvata cu succes!' : 'Expense saved successfully!');
      setMonth(nextMonth);
      setForm((prev) => ({
        ...emptyForm(nextMonth),
        date: prev.date,
        category_id: prev.category_id || String(categories[0]?.id || ''),
        categoryInput: '',
      }));

      const expensesResponse = await api.get(`/expenses?month=${nextMonth}`);
      setAllExpenses(expensesResponse.data || []);

      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(() => {
          amountInputRef.current?.focus();
        });
      }

      setTimeout(() => setSuccess(''), 2500);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || (ro ? 'Salvarea cheltuielii a esuat.' : 'Failed to save expense.'));
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

  const duplicateCurrent = () => {
    setSuccess(ro ? 'Cheltuiala a fost duplicata in formular.' : 'Expense duplicated in form.');
    setTimeout(() => setSuccess(''), 1800);
  };

  const resetForm = () => {
    setForm((prev) => ({
      ...emptyForm(month),
      date: prev.date,
      category_id: prev.category_id || String(categories[0]?.id || ''),
      categoryInput: '',
    }));
    setError('');
    setSuccess('');
  };

  const applyCategoryFromInput = async () => {
    if (isVisitor) {
      setError(ro ? 'Contul de vizitator este doar pentru citire.' : 'Visitor account is read-only.');
      return;
    }

    const name = form.categoryInput.trim();
    if (!name) return;

    const existing = categories.find((item) => item.name.toLowerCase() === name.toLowerCase()) || matchingCategory;
    if (existing) {
      setShowCategorySuggestions(false);
      setForm((prev) => ({ ...prev, category_id: String(existing.id), categoryInput: existing.name }));
      return;
    }

    const color = CATEGORY_STYLES[categories.length % CATEGORY_STYLES.length].border;

    try {
      const { data } = await api.post('/categories', { name, color });
      setCategories((prev) => [...prev, data]);
      setShowCategorySuggestions(false);
      setForm((prev) => ({ ...prev, category_id: String(data.id), categoryInput: data.name }));
      setSuccess(ro ? 'Categoria a fost adaugata.' : 'Category added.');
      setTimeout(() => setSuccess(''), 1500);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || (ro ? 'Adaugarea categoriei a esuat.' : 'Failed to add category.'));
    }
  };

  const createCategoryFromModal = async (name, color) => {
    if (!name) return;

    if (isVisitor) {
      setError(ro ? 'Contul de vizitator este doar pentru citire.' : 'Visitor account is read-only.');
      return;
    }

    setSavingCategory(true);
    setError('');

    try {
      const { data } = await api.post('/categories', { name, color });
      setCategories((prev) => [...prev, data].sort((left, right) => left.name.localeCompare(right.name)));
      setShowCategorySuggestions(false);
      setForm((prev) => ({ ...prev, category_id: String(data.id), categoryInput: data.name }));
      setShowCategoryModal(false);
      setSuccess(ro ? 'Categoria a fost adaugata.' : 'Category added.');
      setTimeout(() => setSuccess(''), 1500);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || (ro ? 'Adaugarea categoriei a esuat.' : 'Failed to add category.'));
    } finally {
      setSavingCategory(false);
    }
  };

  const selectSuggestion = (category) => {
    setShowCategorySuggestions(false);
    setForm((prev) => ({ ...prev, category_id: String(category.id), categoryInput: category.name }));
    setHighlightedSuggestionIndex(0);
  };

  const onTagKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag();
      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(() => {
          notesInputRef.current?.focus();
        });
      }
    }
  };

  const onNotesKeyDown = (event) => {
    if (event.key !== 'Enter') {
      return;
    }

    if (event.shiftKey) {
      return;
    }

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  return (
    <div className="overflow-y-auto pb-8">
      <div className="overflow-hidden rounded-[28px] border border-[#d8d1c6] bg-[#f7f4ee] shadow-[0_20px_60px_rgba(35,27,14,0.08)]">
        <div className="relative border-b border-[#dbd5cb] px-10 py-5">
          <div>
            <h1 className="text-[48px] font-semibold leading-none tracking-[-0.04em] text-[#2e2a24]">{ro ? 'Adauga cheltuiala' : 'Add expense'}</h1>
            <p className="mt-2 text-[14px] text-[#8b8578]">{formatHeaderDate(form.date, locale)} · {user?.first_name} {user?.last_name}</p>
            {isVisitor && (
              <div className="mt-4 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[12px] font-medium text-amber-800">
                {ro ? 'Vizitator: vizualizare doar, fara salvare sau stergere.' : 'Visitor: read-only view, no save or delete.'}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px]">
          <form id="expense-form" onSubmit={saveExpense} className="bg-[#f8f5ef]">
            <fieldset disabled={isVisitor} className="contents">
            <div className="space-y-6 px-5 py-5">
              {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
              {success && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">{success}</div>}

              <div>
                <Label>{ro ? 'Suma *' : 'Amount *'}</Label>
                <div className="mt-2 rounded-2xl border border-[#d9d3ff] bg-white p-1 shadow-[0_0_0_3px_rgba(129,140,248,0.07)]">
                  <div className="flex items-center gap-3 px-3">
                    <span className="text-[22px] font-semibold text-[#7d7468]">LEI</span>
                    <input
                      ref={amountInputRef}
                      className="w-full border-none bg-transparent text-[40px] font-semibold tracking-[-0.03em] text-[#2b2721] outline-none"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="340.00"
                      value={form.amount}
                      onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>{ro ? 'Categorie' : 'Category'}</Label>
                <div className="relative mt-2 rounded-2xl border border-[#d7d2c8] bg-white px-3 py-2">
                  <input
                    className="h-[44px] w-full border-none bg-transparent px-1 pr-8 text-[17px] text-[#2d2922] outline-none"
                    type="text"
                    placeholder={ro ? 'Cauta categorie si apasa Enter...' : 'Search category and press Enter...'}
                    value={form.categoryInput}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setForm((prev) => ({ ...prev, categoryInput: nextValue }));
                      setShowCategorySuggestions(nextValue.trim().length >= 3);
                    }}
                    onFocus={() => {
                      if (form.categoryInput.trim().length >= 3 && categorySuggestions.length > 0) {
                        setShowCategorySuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      window.setTimeout(() => setShowCategorySuggestions(false), 120);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowDown' && categorySuggestions.length > 0) {
                        event.preventDefault();
                        setShowCategorySuggestions(true);
                        setHighlightedSuggestionIndex((prev) => (prev + 1) % categorySuggestions.length);
                        return;
                      }

                      if (event.key === 'ArrowUp' && categorySuggestions.length > 0) {
                        event.preventDefault();
                        setShowCategorySuggestions(true);
                        setHighlightedSuggestionIndex((prev) => (prev - 1 + categorySuggestions.length) % categorySuggestions.length);
                        return;
                      }

                      if (event.key === 'Enter') {
                        event.preventDefault();

                        if (categorySuggestions.length === 1) {
                          selectSuggestion(categorySuggestions[0]);
                          return;
                        }

                        if (categorySuggestions.length > 1) {
                          selectSuggestion(categorySuggestions[highlightedSuggestionIndex] || categorySuggestions[0]);
                          return;
                        }

                        if (exactCategoryMatch) {
                          selectSuggestion(exactCategoryMatch);
                          return;
                        }

                        applyCategoryFromInput();
                      }
                    }}
                  />

                  {showCreateCategoryButton && (
                    <button
                      tabIndex={-1}
                      type="button"
                      onClick={() => {
                        setNewCategoryColor(CATEGORY_STYLES[categories.length % CATEGORY_STYLES.length].border);
                        setShowCategorySuggestions(false);
                        setShowCategoryModal(true);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[26px] leading-none text-[#6366f1]"
                      title={ro ? 'Adauga categorie' : 'Add category'}
                    >
                      +
                    </button>
                  )}

                  {showCategorySuggestions && categorySuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-[#ddd5ca] bg-white shadow-[0_20px_40px_rgba(29,24,18,0.12)]">
                      {categorySuggestions.map((category, index) => {
                        const active = index === highlightedSuggestionIndex;

                        return (
                          <button
                            key={category.id}
                            tabIndex={-1}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => selectSuggestion(category)}
                            className={`flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] ${active ? 'bg-[#f2f0ff]' : 'bg-white hover:bg-[#faf7f1]'}`}
                          >
                            {iconSquare(category.color || '#a8a29e')}
                            <span className="text-[#2d2922]">{category.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr]">
                <div>
                  <Label>{ro ? 'Data' : 'Date'}</Label>
                  <div className="mt-2 grid grid-cols-[minmax(0,1fr)_44px] gap-2">
                    <input
                      ref={dateTextRef}
                      className="h-[52px] rounded-xl border border-[#d7d2c8] bg-white px-4 text-[18px] font-medium text-[#2d2922] outline-none"
                      type="text"
                      placeholder="dd.mm.yyyy"
                      value={form.date}
                      inputMode="numeric"
                      onFocus={(event) => {
                        window.requestAnimationFrame(() => {
                          event.target.setSelectionRange(0, 2);
                        });
                      }}
                      onChange={(event) => {
                        const rawPos = event.target.selectionStart;
                        const rawVal = event.target.value;
                        const nextValue = formatDateInput(rawVal);
                        // Adjust cursor: if a dot was inserted before current pos, push forward
                        const dotsBefore = (rawVal.slice(0, rawPos).match(/\./g) || []).length;
                        const dotsAfterFmt = (nextValue.slice(0, rawPos).match(/\./g) || []).length;
                        dateCursorRef.current = rawPos + (dotsAfterFmt - dotsBefore);
                        setForm((prev) => ({ ...prev, date: nextValue }));
                        window.requestAnimationFrame(() => {
                          if (dateTextRef.current && dateCursorRef.current !== null) {
                            dateTextRef.current.setSelectionRange(dateCursorRef.current, dateCursorRef.current);
                            dateCursorRef.current = null;
                          }
                        });
                      }}
                    />
                    <button
                      tabIndex={-1}
                      type="button"
                      onClick={() => datePickerRef.current?.showPicker?.() || datePickerRef.current?.click()}
                      className="relative grid h-[52px] place-items-center rounded-xl border border-[#d7d2c8] bg-white text-[#2d2922]"
                    >
                      <IconCalendarEvent size={18} stroke={1.9} aria-hidden="true" />
                      <input
                        ref={datePickerRef}
                        type="date"
                        value={inputDateToApi(form.date)}
                        onChange={(event) => {
                          const nextValue = apiDateToDisplay(event.target.value);
                          setForm((prev) => ({ ...prev, date: nextValue }));
                        }}
                        className="absolute inset-0 cursor-pointer opacity-0"
                        tabIndex={-1}
                        aria-label={ro ? 'Alege data' : 'Pick date'}
                      />
                    </button>
                  </div>
                </div>

                <div>
                  <Label>{ro ? 'Metoda de plata' : 'Payment Method'}</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2 xl:grid-cols-4">
                    {paymentOptions.map((option) => (
                      <PaymentPill
                        key={option.value}
                        label={option.label}
                        value={option.value}
                        active={form.payment === option.value}
                        onClick={() => setForm((prev) => ({ ...prev, payment: option.value }))}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label>{ro ? 'Etichete' : 'Tags'}</Label>
                <div className="mt-2 rounded-2xl border border-[#d7d2c8] bg-white px-3 py-3">
                  {form.tags.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {form.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-[#eeecff] px-3 py-1 text-[14px] font-medium text-[#6a62ff]">
                          <span>{tag}</span>
                          <button tabIndex={-1} type="button" onClick={() => removeTag(tag)} className="text-[#a29cf7]" aria-label={ro ? `Elimina eticheta ${tag}` : `Remove tag ${tag}`}>
                            <IconX size={12} stroke={2.2} aria-hidden="true" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <input
                    className="h-[40px] w-full rounded-xl border border-[#d7d2c8] bg-white px-4 text-[17px] text-[#2d2922] outline-none"
                    type="text"
                    placeholder={ro ? 'Adauga eticheta...' : 'Add tag...'}
                    value={form.tagInput}
                    onChange={(event) => setForm((prev) => ({ ...prev, tagInput: event.target.value }))}
                    onKeyDown={onTagKeyDown}
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {presetTags.map((preset) => (
                    <button
                      key={preset}
                      tabIndex={-1}
                      type="button"
                      onClick={() => {
                        const tag = preset.replace('+ ', '');
                        if (!form.tags.includes(tag)) {
                          setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
                        }
                      }}
                      className="rounded-full border border-[#d7d2c8] bg-[#f8f5ef] px-3 py-1.5 text-[14px] text-[#6e675d] transition hover:bg-white"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>{ro ? 'Note' : 'Notes'}</Label>
                <textarea
                  ref={notesInputRef}
                  className="mt-2 min-h-[116px] w-full rounded-2xl border border-[#d7d2c8] bg-white px-4 py-3 text-[17px] text-[#2d2922] outline-none"
                  placeholder={ro ? 'Adauga context sau note pentru aceasta cheltuiala...' : 'Add context or notes about this expense...'}
                  value={form.notes}
                  onKeyDown={onNotesKeyDown}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                />
              </div>
            </div>

            <div className="hidden items-center justify-between gap-3 border-t border-[#dbd5cb] px-5 py-4 md:flex">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#e4d8c7] bg-[#fff8ef] px-6 py-3 text-[16px] font-medium text-[#8a5a2b]"
                >
                  {actionIcon('cancel', '#c07b38')}
                  <span>{ro ? 'Anuleaza' : 'Cancel'}</span>
                </button>
                <button type="button" onClick={duplicateCurrent} className="inline-flex items-center gap-2 rounded-2xl border border-[#d9d3ff] bg-[#f3f0ff] px-6 py-3 text-[16px] font-medium text-[#5b55d6]">
                  {actionIcon('duplicate', '#6d66f6')}
                  <span>{ro ? 'Duplica' : 'Duplicate'}</span>
                </button>
              </div>

              <button type="submit" className="inline-flex items-center gap-2 rounded-2xl border border-[#c9d8ff] bg-[#edf4ff] px-7 py-3 text-[16px] font-semibold text-[#2856c5] shadow-sm">
                {actionIcon('save', '#3a6be0')}
                <span>{ro ? 'Salveaza cheltuiala' : 'Save expense'}</span>
              </button>
            </div>

            <div className="border-t border-[#dbd5cb] px-5 py-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#8f8a7a]">{ro ? 'Ultimele 5 inregistrari' : 'Last 5 entries'}</p>

              {latestFiveExpenses.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {latestFiveExpenses.map((expense, index) => {
                    const color = expense.category?.color || CATEGORY_STYLES[index % CATEGORY_STYLES.length].border;

                    return (
                      <div
                        key={expense.id || `${expense.date}-${index}`}
                        className="flex items-center justify-between py-1"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-semibold" style={{ color }}>
                            {expense.description || expense.category?.name || (ro ? 'Cheltuiala' : 'Expense')}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-[12px] text-[#7b756a]">{apiDateToDisplay(expense.date) || expense.date}</p>
                            {expense.tag && <p className="text-[12px] text-[#7b756a]">· {expense.tag}</p>}
                          </div>
                        </div>
                        <p className="ml-3 text-[14px] font-semibold" style={{ color }}>
                          {formatMoney(expense.amount || 0, numberLocale)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 text-[13px] text-[#8f8a7a]">{ro ? 'Nu exista inregistrari inca.' : 'No entries yet.'}</p>
              )}
            </div>
            </fieldset>
          </form>

          {/* Right panel: preview + chart + top list — desktop only */}
          <div className="hidden lg:flex lg:flex-col gap-5 border-l border-[#dbd5cb] bg-[#f3efe8] px-5 py-6">

            {/* Preview card */}
            {selectedCategory && (
              <div className="rounded-2xl border border-[#dbd5cb] bg-white p-5 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8f8a7a]">{ro ? 'Previzualizare live' : 'Live Preview'}</p>

                <p className="mt-3 text-[32px] font-bold leading-none tracking-[-0.02em] text-[#1a1714]">{formatMoney(form.amount || 0, numberLocale)}</p>
                <p className="mt-1.5 text-[13px] text-[#8b8578]">{formatPreviewDate(form.date, locale)} · {selectedCategory.name}</p>

                <div className="mt-4 border-t border-[#ece8e0] pt-3">
                  <table className="w-full text-[13px]">
                    <tbody>
                      <tr className="border-b border-[#f0ebe3]">
                        <td className="py-2 pr-3 font-medium text-[#6b6760] w-[90px]">{ro ? 'Categorie' : 'Category'}</td>
                        <td className="py-2 text-right">
                          <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: selectedCategory.color }}>
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: selectedCategory.color }} />
                            {selectedCategory.name}
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-[#f0ebe3]">
                        <td className="py-2 pr-3 font-medium text-[#6b6760]">{ro ? 'Plata' : 'Payment'}</td>
                        <td className="py-2 text-right">
                          <span className="inline-flex items-center gap-1.5 text-[#4a4540]">
                            {form.payment === 'Card'
                              ? <IconCreditCard size={14} stroke={1.9} aria-hidden="true" />
                              : <IconCash size={14} stroke={1.9} aria-hidden="true" />}
                            {form.payment}
                          </span>
                        </td>
                      </tr>
                      {form.tags.length > 0 && (
                        <tr className="border-b border-[#f0ebe3]">
                          <td className="py-2 pr-3 font-medium text-[#6b6760]">{ro ? 'Etichete' : 'Tags'}</td>
                          <td className="py-2 text-right">
                            <div className="flex flex-wrap justify-end gap-1">
                              {form.tags.map((tag) => (
                                <span key={tag} className="rounded-full bg-[#f0eeff] px-2 py-0.5 text-[12px] font-medium text-[#5b55d6]">{tag}</span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                      <tr className="border-b border-[#f0ebe3]">
                        <td className="py-2 pr-3 font-medium text-[#6b6760]">{ro ? 'Note' : 'Notes'}</td>
                        <td className="py-2 text-right text-[#4a4540]">{form.notes || <span className="text-[#c0b9b0]">—</span>}</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-3 font-medium text-[#6b6760]">{ro ? 'Atasament' : 'Attachment'}</td>
                        <td className="py-2 text-right text-[#c0b9b0]">{ro ? 'Niciunul' : 'None'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pie chart */}
            {categorySpendData.topList.length > 0 && (
              <div className="rounded-2xl border border-[#dbd5cb] bg-white p-5 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8f8a7a]">{ro ? 'Cheltuieli luna aceasta' : 'Spending this month'}</p>
                <div className="mx-auto mt-4 w-[160px]">
                  <PieChart data={categorySpendData.chartData} variant="pseudo3d" />
                </div>

                {/* Top 8 list — colored text, no bullets */}
                <div className="mt-5 space-y-1.5">
                  {categorySpendData.topList.map(([name, v]) => (
                    <div key={name} className="flex items-center justify-between">
                      <span className="truncate text-[13px]" style={{ color: v.color }}>{name}</span>
                      <span className="ml-2 shrink-0 text-[13px] font-semibold" style={{ color: v.color }}>{formatMoney(v.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      <div className="fixed inset-x-3 bottom-[84px] z-30 flex gap-2 rounded-2xl border border-black/5 bg-white/95 p-2 shadow-lg backdrop-blur md:hidden">
        <button type="button" onClick={() => navigate(dashboardPath)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#e4d8c7] bg-[#fff8ef] py-3 text-sm font-medium text-[#8a5a2b]">
          {actionIcon('cancel', '#c07b38')}
          <span>{ro ? 'Anuleaza' : 'Cancel'}</span>
        </button>
        <button type="button" onClick={duplicateCurrent} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#d9d3ff] bg-[#f3f0ff] py-3 text-sm font-medium text-[#5b55d6]">
          {actionIcon('duplicate', '#6d66f6')}
          <span>{ro ? 'Duplica' : 'Duplicate'}</span>
        </button>
        <button type="submit" form="expense-form" disabled={isVisitor} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#c9d8ff] bg-[#edf4ff] py-3 text-sm font-semibold text-[#2856c5] disabled:cursor-not-allowed disabled:opacity-50">
          {actionIcon('save', '#3a6be0')}
          <span>{ro ? 'Salveaza' : 'Save'}</span>
        </button>
      </div>

      {showCategoryModal && (
        <AddCategoryModal
          initialName={form.categoryInput.trim()}
          initialColor={newCategoryColor}
          onClose={() => setShowCategoryModal(false)}
          onSubmit={createCategoryFromModal}
          saving={savingCategory}
          locale={locale}
        />
      )}
    </div>
  );
}
