import { useEffect, useRef, useState } from 'react';
import { IconPencil, IconPlus, IconTrash, IconX } from '@tabler/icons-react';
import { useLocale } from '../i18n/LocaleContext';
import api from '../services/api';

function normalizeCategoryKey(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function translateCategoryName(name, locale) {
  const key = normalizeCategoryKey(name);

  const roToEn = {
    mancare: 'Food',
    transport: 'Transport',
    utilitati: 'Utilities',
    sanatate: 'Health',
    educatie: 'Education',
    divertisment: 'Entertainment',
    cumparaturi: 'Shopping',
    casa: 'Housing',
    calatorii: 'Travel',
    altele: 'Other',
  };

  const enToRo = {
    food: 'Mancare',
    transport: 'Transport',
    utilities: 'Utilitati',
    health: 'Sanatate',
    education: 'Educatie',
    entertainment: 'Divertisment',
    shopping: 'Cumparaturi',
    housing: 'Casa',
    travel: 'Calatorii',
    other: 'Altele',
  };

  if (locale === 'ro') {
    return enToRo[key] || name;
  }

  return roToEn[key] || name;
}

function PencilIcon() {
  return <IconPencil size={16} stroke={2} aria-hidden="true" />;
}

function TrashIcon() {
  return <IconTrash size={16} stroke={2} aria-hidden="true" />;
}

function AddModal({ onClose, onSaved }) {
  const { locale } = useLocale();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const colorRef = useRef(null);
  const nameRef = useRef(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await api.post('/categories', { name: name.trim(), color });
    onSaved();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-slate-900">{locale === 'ro' ? 'Categorie nouă' : 'New category'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 flex-shrink-0"
          >
            <IconX size={16} stroke={2} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{locale === 'ro' ? 'Titlu' : 'Title'}</label>
              <h3 className="text-[16px] font-semibold text-slate-900">{locale === 'ro' ? 'Categorie nouă' : 'New category'}</h3>
            </div>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{locale === 'ro' ? 'Nume' : 'Name'}</label>
                <input
                  ref={nameRef}
                  className="input flex-1 h-[40px]"
                  placeholder={locale === 'ro' ? 'Nume categorie' : 'Category name'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{locale === 'ro' ? 'Culoare' : 'Color'}</label>
                <button
                  type="button"
                  onClick={() => colorRef.current?.click()}
                  className="h-10 w-10 rounded-lg border border-black/10 shadow-sm transition-transform hover:scale-105 active:scale-95 flex-shrink-0"
                  style={{ backgroundColor: color }}
                  title={locale === 'ro' ? 'Alege culoarea' : 'Pick color'}
                />
                <input
                  ref={colorRef}
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="sr-only"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2 border-t border-black/5 pt-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-black/10 px-3 py-1.5 text-[12px] font-medium text-slate-700">
              {locale === 'ro' ? 'Anulează' : 'Cancel'}
            </button>
            <button type="submit" className="btn px-4 py-1.5 text-[12px]">
              {locale === 'ro' ? 'Adaugă' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditModal({ category, onClose, onSaved }) {
  const { locale } = useLocale();
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color);
  const colorRef = useRef(null);
  const nameRef = useRef(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await api.put(`/categories/${category.id}`, { name: name.trim(), color });
    onSaved();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-slate-900">{locale === 'ro' ? 'Editează categoria' : 'Edit category'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 flex-shrink-0"
          >
            <IconX size={16} stroke={2} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{locale === 'ro' ? 'Nume' : 'Name'}</label>
              <input
                ref={nameRef}
                className="input flex-1 h-[40px]"
                placeholder={locale === 'ro' ? 'Nume categorie' : 'Category name'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{locale === 'ro' ? 'Culoare' : 'Color'}</label>
              <button
                type="button"
                onClick={() => colorRef.current?.click()}
                className="h-10 w-10 rounded-lg border border-black/10 shadow-sm transition-transform hover:scale-105 active:scale-95 flex-shrink-0"
                style={{ backgroundColor: color }}
                title={locale === 'ro' ? 'Alege culoarea' : 'Pick color'}
              />
              <input
                ref={colorRef}
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="sr-only"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2 border-t border-black/5 pt-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-black/10 px-3 py-1.5 text-[12px] font-medium text-slate-700">
              {locale === 'ro' ? 'Anulează' : 'Cancel'}
            </button>
            <button type="submit" className="btn px-4 py-1.5 text-[12px]">
              {locale === 'ro' ? 'Salvează' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Categories({ user }) {
  const { locale } = useLocale();
  const isVisitor = user?.role === 'visitor';
  const [items, setItems] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const load = async () => {
    const { data } = await api.get('/categories');
    setItems(data);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id) => {
    await api.delete(`/categories/${id}`);
    await load();
  };

  return (
    <div className="space-y-3">
      {showAdd && (
        <AddModal onClose={() => setShowAdd(false)} onSaved={load} />
      )}
      {editingCategory && (
        <EditModal category={editingCategory} onClose={() => setEditingCategory(null)} onSaved={load} />
      )}

      <div className="card">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="font-semibold text-[15px] text-slate-900">{locale === 'ro' ? 'Categorii' : 'Categories'} ({items.length})</h2>
          {!isVisitor && (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="grid h-11 w-11 place-items-center rounded-full bg-[var(--accent)] text-white shadow-md transition-transform hover:scale-105 active:scale-95"
              title={locale === 'ro' ? 'Adaugă categorie' : 'Add category'}
              aria-label={locale === 'ro' ? 'Adaugă categorie' : 'Add category'}
            >
              <IconPlus size={20} stroke={2.2} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className={`grid gap-2 ${items.length > 16 ? 'grid-cols-2 sm:grid-cols-3' : items.length > 8 ? 'grid-cols-2 sm:grid-cols-2' : 'grid-cols-2'}`}>
          {items.map((category) => (
            <div key={category.id} className="group py-2 px-2 flex items-center justify-between hover:bg-slate-50 rounded-lg border border-transparent hover:border-black/5">
              <div className="flex items-center text-sm flex-1 min-w-0">
                <span className="truncate text-[16px] font-semibold" style={{ color: category.color }}>{translateCategoryName(category.name, locale)}</span>
              </div>
              {!isVisitor && (
                <div className="flex items-center gap-1 ml-1 md:opacity-0 md:group-hover:opacity-100 md:transition-opacity flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingCategory(category)}
                    className="text-indigo-600 hover:text-indigo-700 p-0.5"
                    title={locale === 'ro' ? 'Editează' : 'Edit'}
                  >
                    <PencilIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(category.id)}
                    className="text-rose-600 hover:text-rose-700 p-0.5"
                    title={locale === 'ro' ? 'Șterge' : 'Delete'}
                  >
                    <TrashIcon />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
