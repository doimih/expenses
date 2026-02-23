import { useEffect, useState } from 'react';
import api from '../services/api';

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
        <div className="space-y-2">
          {items.map((category) => (
            <div key={category.id} className="rounded border p-2">
              {editingId === category.id ? (
                <form className="grid md:grid-cols-4 gap-3" onSubmit={(event) => update(event, category.id)}>
                  <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                  <input className="input" type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} required />
                  <button className="btn" type="submit">Salvează</button>
                  <button className="rounded-md px-4 py-2 text-sm font-semibold bg-slate-200" type="button" onClick={cancelEdit}>Anulează</button>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ background: category.color }} />
                    <span>{category.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="text-sm text-indigo-600" onClick={() => startEdit(category)}>Editează</button>
                    <button className="text-sm text-rose-600" onClick={() => remove(category.id)}>Șterge</button>
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
