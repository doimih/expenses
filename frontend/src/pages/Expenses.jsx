import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function Expenses() {
  const [month, setMonth] = useState(currentMonth());
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ category_id: '', amount: '', description: '', date: new Date().toISOString().slice(0, 10) });

  const load = async () => {
    const [c, e] = await Promise.all([
      api.get('/categories'),
      api.get(`/expenses?month=${month}`),
    ]);

    setCategories(c.data);
    setExpenses(e.data);
  };

  useEffect(() => {
    load();
  }, [month]);

  const total = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item.amount), 0).toFixed(2),
    [expenses]
  );

  const resetForm = () => {
    setForm({ category_id: '', amount: '', description: '', date: new Date().toISOString().slice(0, 10) });
    setEditingId(null);
  };

  const save = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      amount: Number(form.amount),
    };

    if (editingId) {
      await api.put(`/expenses/${editingId}`, payload);
    } else {
      await api.post('/expenses', payload);
    }

    resetForm();
    await load();
  };

  const startEdit = (expense) => {
    setEditingId(expense.id);
    setForm({
      category_id: String(expense.category_id),
      amount: String(expense.amount),
      description: expense.description || '',
      date: expense.date,
    });
  };

  const remove = async (id) => {
    await api.delete(`/expenses/${id}`);
    if (editingId === id) {
      resetForm();
    }
    await load();
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="font-semibold mb-3">{editingId ? 'Editează cheltuială' : 'Adaugă cheltuială'}</h2>
        <form className="grid md:grid-cols-4 gap-3" onSubmit={save}>
          <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required>
            <option value="">Categorie</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <input className="input" type="number" step="0.01" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          <input className="input" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="md:col-span-4 flex items-center gap-3">
            <button className="btn" type="submit">{editingId ? 'Actualizează' : 'Salvează'}</button>
            {editingId && (
              <button className="rounded-md px-4 py-2 text-sm font-semibold bg-slate-200" type="button" onClick={resetForm}>Anulează editarea</button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Cheltuieli ({month})</h2>
          <div className="flex items-center gap-2">
            <input className="input" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            <span className="font-semibold">Total: {total}</span>
          </div>
        </div>

        <div className="space-y-2">
          {expenses.map((expense) => (
            <div key={expense.id} className="rounded border p-2 flex items-center justify-between">
              <div>
                <p className="font-medium">{expense.category?.name} - {expense.amount}</p>
                <p className="text-sm text-slate-500">{expense.date} · {expense.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="text-sm text-indigo-600" onClick={() => startEdit(expense)}>Editează</button>
                <button className="text-sm text-rose-600" onClick={() => remove(expense.id)}>Șterge</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
