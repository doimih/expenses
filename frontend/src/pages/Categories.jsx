import { useEffect, useRef, useState } from 'react';
import api from '../services/api';

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.1 2.1 0 1 1 2.97 2.97L8.4 17.89l-3.9.93.93-3.9L16.862 3.487z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 11v6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 7l1 12h10l1-12" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7V5h6v2" />
    </svg>
  );
}

function AddModal({ onClose, onSaved }) {
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
          <h2 className="text-[15px] font-semibold text-slate-900">Categorie nouă</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 flex-shrink-0"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Titlu</label>
              <h3 className="text-[16px] font-semibold text-slate-900">Categorie nouă</h3>
            </div>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Nume</label>
                <input
                  ref={nameRef}
                  className="input flex-1 h-[40px]"
                  placeholder="Nume categorie"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Culoare</label>
                <button
                  type="button"
                  onClick={() => colorRef.current?.click()}
                  className="h-10 w-10 rounded-lg border border-black/10 shadow-sm transition-transform hover:scale-105 active:scale-95 flex-shrink-0"
                  style={{ backgroundColor: color }}
                  title="Alege culoarea"
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
              Anulează
            </button>
            <button type="submit" className="btn px-4 py-1.5 text-[12px]">
              Adaugă
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditModal({ category, onClose, onSaved }) {
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
          <h2 className="text-[15px] font-semibold text-slate-900">Editează categoria</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 flex-shrink-0"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Nume</label>
              <input
                ref={nameRef}
                className="input flex-1 h-[40px]"
                placeholder="Nume categorie"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Culoare</label>
              <button
                type="button"
                onClick={() => colorRef.current?.click()}
                className="h-10 w-10 rounded-lg border border-black/10 shadow-sm transition-transform hover:scale-105 active:scale-95 flex-shrink-0"
                style={{ backgroundColor: color }}
                title="Alege culoarea"
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
              Anulează
            </button>
            <button type="submit" className="btn px-4 py-1.5 text-[12px]">
              Salvează
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Categories({ user }) {
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

      <div className="card flex items-center justify-between gap-3">
        <h2 className="font-semibold text-slate-900 text-[15px]">Categorie nouă</h2>
        {isVisitor ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-700 flex-shrink-0">
            Nu poți adăuga categorii.
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="grid h-8 w-8 place-items-center rounded-full bg-[var(--accent)] text-white shadow hover:opacity-90 active:scale-95 transition-transform text-[20px] leading-none flex-shrink-0"
            title="Adaugă categorie"
          >
            +
          </button>
        )}
      </div>

      <div className="card">
        <h2 className="font-semibold mb-2 text-[15px]">Categorii ({items.length})</h2>
        <div className={`grid gap-2 ${items.length > 16 ? 'grid-cols-2 sm:grid-cols-3' : items.length > 8 ? 'grid-cols-2 sm:grid-cols-2' : 'grid-cols-2'}`}>
          {items.map((category) => (
            <div key={category.id} className="group py-2 px-2 flex items-center justify-between hover:bg-slate-50 rounded-lg border border-transparent hover:border-black/5">
              <div className="flex items-center text-sm flex-1 min-w-0">
                <span className="truncate text-[16px] font-semibold" style={{ color: category.color }}>{category.name}</span>
              </div>
              {!isVisitor && (
                <div className="flex items-center gap-1 ml-1 md:opacity-0 md:group-hover:opacity-100 md:transition-opacity flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingCategory(category)}
                    className="text-indigo-600 hover:text-indigo-700 p-0.5"
                    title="Editează"
                  >
                    <PencilIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(category.id)}
                    className="text-rose-600 hover:text-rose-700 p-0.5"
                    title="Șterge"
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
