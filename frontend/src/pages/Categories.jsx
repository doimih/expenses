import { useEffect, useState } from 'react';
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

export default function Categories() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#3B82F6');

  const load = async () => {
    const { data } = await api.get('/categories');
    setItems(data);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (event) => {
    event.preventDefault();
    await api.post('/categories', { name, color });
    setName('');
    await load();
  };

  const remove = async (id) => {
    await api.delete(`/categories/${id}`);
    await load();
  };

  const startEdit = (category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditColor(category.color);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditColor('#3B82F6');
  };

  const update = async (event, id) => {
    event.preventDefault();
    await api.put(`/categories/${id}`, { name: editName, color: editColor });
    cancelEdit();
    await load();
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="font-semibold mb-3">Categorie nouă</h2>
        <form className="grid md:grid-cols-3 gap-3" onSubmit={create}>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
          <input className="input" type="color" value={color} onChange={(e) => setColor(e.target.value)} required />
          <button className="btn" type="submit">Adaugă</button>
        </form>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Categorii</h2>
        <div className={`grid gap-x-6 ${items.length > 16 ? 'grid-cols-1 sm:grid-cols-3' : items.length > 8 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
          {items.map((category) => (
            <div key={category.id}>
              {editingId === category.id ? (
                <form className="grid grid-cols-[1fr_40px_auto_auto] gap-2 items-center py-[2px]" onSubmit={(event) => update(event, category.id)}>
                  <input className="input text-sm" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                  <input className="input h-8 p-0.5" type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} required />
                  <button className="btn text-sm px-2 py-1" type="submit">Salvează</button>
                  <button className="rounded-md px-2 py-1 text-sm font-semibold bg-slate-200" type="button" onClick={cancelEdit}>Anulează</button>
                </form>
              ) : (
                <div className="group py-[2px] px-2 flex items-center justify-between hover:bg-slate-50 rounded">
                  <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
                    <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: category.color }} />
                    <span className="truncate">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 md:transition-opacity">
                    <span
                      className="text-indigo-600 cursor-pointer"
                      title="Editează"
                      role="button"
                      tabIndex={0}
                      onClick={() => startEdit(category)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit(category); } }}
                    >
                      <PencilIcon />
                    </span>
                    <span
                      className="text-rose-600 cursor-pointer"
                      title="Șterge"
                      role="button"
                      tabIndex={0}
                      onClick={() => remove(category.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); remove(category.id); } }}
                    >
                      <TrashIcon />
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
