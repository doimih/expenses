import { useEffect, useState } from 'react';
import api from '../services/api';

const emptyNewUser = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  password_confirmation: '',
  role: 'user',
};

const roleOptions = [
  { value: 'visitor', label: 'Vizitator' },
  { value: 'user', label: 'User' },
  { value: 'superadmin', label: 'Superadmin' },
];

const roleBadgeClasses = {
  visitor: 'bg-amber-100 text-amber-700',
  user: 'bg-sky-100 text-sky-700',
  superadmin: 'bg-indigo-100 text-indigo-700',
};

const roleLabels = {
  visitor: 'Vizitator',
  user: 'User',
  superadmin: 'Superadmin',
};

const getUserDisplayName = (user) => {
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return fullName || user.name || '-';
};

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

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a4 4 0 1 0-7.75 1.25L3 12.5V15h2.5v2H8v2h3l4.25-4.25A4 4 0 0 0 15 7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5h.01" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.1 2.1 0 1 1 2.97 2.97L8.4 17.89l-3.9.93.93-3.9L16.862 3.487z" />
    </svg>
  );
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [passwords, setPasswords] = useState({});
  const [newUser, setNewUser] = useState(emptyNewUser);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [passwordModalUser, setPasswordModalUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({ firstName: '', lastName: '', email: '', role: 'user' });

  const load = async () => {
    setError('');
    const { data } = await api.get('/users');
    setUsers(data);
  };

  useEffect(() => {
    load().catch((e) => setError(e?.response?.data?.message || 'Nu pot încărca utilizatorii'));
  }, []);

  const onChange = (userId, field, value) => {
    setPasswords((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || { password: '', password_confirmation: '' }),
        [field]: value,
      },
    }));
  };

  const updatePassword = async (event, userId) => {
    event.preventDefault();
    setMessage('');
    setError('');

    const payload = passwords[userId] || { password: '', password_confirmation: '' };

    try {
      await api.put(`/users/${userId}/password`, payload);
      setMessage('Parola a fost actualizată cu succes.');
      setPasswords((prev) => ({
        ...prev,
        [userId]: { password: '', password_confirmation: '' },
      }));
      setPasswordModalUser(null);
    } catch (e) {
      setError(e?.response?.data?.message || 'Eroare la actualizarea parolei');
    }
  };

  const createUser = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      await api.post('/users', {
        first_name: newUser.firstName.trim(),
        last_name: newUser.lastName.trim(),
        email: newUser.email,
        password: newUser.password,
        password_confirmation: newUser.password_confirmation,
        role: newUser.role,
      });
      setMessage('Utilizator creat cu succes.');
      setNewUser(emptyNewUser);
      setIsCreateModalOpen(false);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Eroare la crearea utilizatorului');
    }
  };

  const deleteUser = async (user) => {
    const confirmed = window.confirm(`Ștergi utilizatorul ${getUserDisplayName(user)}?`);

    if (!confirmed) {
      return;
    }

    setDeletingUserId(user.id);
    setMessage('');
    setError('');

    try {
      await api.delete(`/users/${user.id}`);
      setMessage('Utilizator șters cu succes.');
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Eroare la ștergerea utilizatorului');
    } finally {
      setDeletingUserId(null);
    }
  };

  const openPasswordModal = (user) => {
    setPasswords((prev) => ({
      ...prev,
      [user.id]: prev[user.id] || { password: '', password_confirmation: '' },
    }));
    setPasswordModalUser(user);
  };

  const openEditModal = (user) => {
    setEditUserForm({
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      email: user.email || '',
      role: user.role || 'user',
    });
    setEditingUser(user);
  };

  const updateUser = async (event) => {
    event.preventDefault();
    if (!editingUser) {
      return;
    }

    setMessage('');
    setError('');

    try {
      await api.put(`/users/${editingUser.id}`, {
        first_name: editUserForm.firstName.trim(),
        last_name: editUserForm.lastName.trim(),
        email: editUserForm.email.trim(),
        role: editUserForm.role,
      });
      setMessage('Utilizator actualizat cu succes.');
      setEditingUser(null);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Eroare la actualizarea utilizatorului');
    }
  };

  return (
    <div className="space-y-4">
      <div className="card flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Users</h2>
          <p className="text-sm text-slate-500">Doar superadmin poate modifica parolele utilizatorilor.</p>
        </div>
        <button
          className="grid h-10 w-10 place-items-center rounded-full bg-indigo-600 text-xl font-semibold text-white transition hover:bg-indigo-700"
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          aria-label="Adaugă utilizator"
          title="Adaugă utilizator"
        >
          +
        </button>
      </div>

      {message && <div className="card text-emerald-700">{message}</div>}
      {error && <div className="card text-rose-700">{error}</div>}

      <div className="grid gap-4 lg:grid-cols-2">
        {users.map((user) => (
          <div key={user.id} className="group relative card space-y-4 border border-slate-200">
            <div className="absolute right-4 top-4 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <button
                className="rounded bg-sky-100 p-2 text-sky-700"
                type="button"
                onClick={() => openEditModal(user)}
                aria-label="Editează utilizator"
                title="Editează utilizator"
              >
                <PencilIcon />
              </button>
              <button
                className="rounded bg-amber-100 p-2 text-amber-700"
                type="button"
                onClick={() => openPasswordModal(user)}
                aria-label="Schimbă parola"
                title="Schimbă parola"
              >
                <KeyIcon />
              </button>
              <button
                className="rounded bg-rose-100 p-2 text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={() => deleteUser(user)}
                disabled={deletingUserId === user.id}
                aria-label="Șterge utilizator"
                title="Șterge utilizator"
              >
                {deletingUserId === user.id ? '...' : <TrashIcon />}
              </button>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Utilizator #{user.id}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{getUserDisplayName(user)}</p>
                <p className="text-sm text-slate-500">Creat la: {new Date(user.created_at).toLocaleDateString('ro-RO')}</p>
              </div>
              <span className={`rounded px-2 py-1 text-xs font-semibold ${roleBadgeClasses[user.role || 'user'] || roleBadgeClasses.user}`}>
                {roleLabels[user.role || 'user'] || 'User'}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-3 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Credentiale</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{user.email}</p>
                <p className="mt-1 text-xs text-slate-500">Rol activ: {roleLabels[user.role || 'user'] || 'User'}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Nume complet</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{getUserDisplayName(user)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl overflow-auto rounded-3xl bg-white p-6 shadow-2xl sm:aspect-square">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Adaugă utilizator</h3>
                <p className="text-sm text-slate-500">Completează datele și salvează noul cont.</p>
              </div>
              <button
                className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-lg font-semibold text-slate-600 transition hover:bg-slate-200"
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                aria-label="Închide"
                title="Închide"
              >
                ×
              </button>
            </div>

            <form className="grid h-full content-start gap-4 sm:grid-cols-2" onSubmit={createUser}>
              <input
                className="input"
                placeholder="Prenume"
                value={newUser.firstName}
                onChange={(event) => setNewUser((prev) => ({ ...prev, firstName: event.target.value }))}
                required
              />
              <input
                className="input"
                placeholder="Nume"
                value={newUser.lastName}
                onChange={(event) => setNewUser((prev) => ({ ...prev, lastName: event.target.value }))}
                required
              />
              <input
                className="input sm:col-span-2"
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(event) => setNewUser((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
              <input
                className="input"
                type="password"
                placeholder="Parolă"
                value={newUser.password}
                onChange={(event) => setNewUser((prev) => ({ ...prev, password: event.target.value }))}
                minLength={8}
                required
              />
              <input
                className="input"
                type="password"
                placeholder="Confirmare"
                value={newUser.password_confirmation}
                onChange={(event) => setNewUser((prev) => ({ ...prev, password_confirmation: event.target.value }))}
                minLength={8}
                required
              />
              <label className="text-sm flex items-center gap-2 sm:col-span-2">
                Rol
              </label>
              <select
                className="input sm:col-span-2"
                value={newUser.role}
                onChange={(event) => setNewUser((prev) => ({ ...prev, role: event.target.value }))}
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <div className="mt-auto flex items-center justify-end gap-3 sm:col-span-2">
                <button
                  className="rounded-md px-4 py-2 text-sm font-semibold bg-slate-200 text-slate-700"
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Anulează
                </button>
                <button className="btn" type="submit">Creează</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {passwordModalUser && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Schimbă parola</h3>
                <p className="text-sm text-slate-500">{getUserDisplayName(passwordModalUser)}</p>
              </div>
              <button
                className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-lg font-semibold text-slate-600 transition hover:bg-slate-200"
                type="button"
                onClick={() => setPasswordModalUser(null)}
                aria-label="Închide"
                title="Închide"
              >
                ×
              </button>
            </div>

            <form className="grid gap-4" onSubmit={(event) => updatePassword(event, passwordModalUser.id)}>
              <input
                className="input"
                type="password"
                placeholder="Parolă nouă"
                value={passwords[passwordModalUser.id]?.password || ''}
                onChange={(event) => onChange(passwordModalUser.id, 'password', event.target.value)}
                minLength={8}
                required
              />
              <input
                className="input"
                type="password"
                placeholder="Confirmare parolă"
                value={passwords[passwordModalUser.id]?.password_confirmation || ''}
                onChange={(event) => onChange(passwordModalUser.id, 'password_confirmation', event.target.value)}
                minLength={8}
                required
              />
              <div className="flex items-center justify-end gap-3">
                <button
                  className="rounded-md px-4 py-2 text-sm font-semibold bg-slate-200 text-slate-700"
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                >
                  Anulează
                </button>
                <button className="btn" type="submit">Actualizează parola</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Editează utilizator</h3>
                <p className="text-sm text-slate-500">{getUserDisplayName(editingUser)}</p>
              </div>
              <button
                className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-lg font-semibold text-slate-600 transition hover:bg-slate-200"
                type="button"
                onClick={() => setEditingUser(null)}
                aria-label="Închide"
                title="Închide"
              >
                ×
              </button>
            </div>

            <form className="grid gap-4 sm:grid-cols-2" onSubmit={updateUser}>
              <input
                className="input"
                placeholder="Prenume"
                value={editUserForm.firstName}
                onChange={(event) => setEditUserForm((prev) => ({ ...prev, firstName: event.target.value }))}
                required
              />
              <input
                className="input"
                placeholder="Nume"
                value={editUserForm.lastName}
                onChange={(event) => setEditUserForm((prev) => ({ ...prev, lastName: event.target.value }))}
                required
              />
              <input
                className="input sm:col-span-2"
                type="email"
                placeholder="Email"
                value={editUserForm.email}
                onChange={(event) => setEditUserForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
              <select
                className="input sm:col-span-2"
                value={editUserForm.role}
                onChange={(event) => setEditUserForm((prev) => ({ ...prev, role: event.target.value }))}
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <div className="flex items-center justify-end gap-3 sm:col-span-2">
                <button
                  className="rounded-md px-4 py-2 text-sm font-semibold bg-slate-200 text-slate-700"
                  type="button"
                  onClick={() => setEditingUser(null)}
                >
                  Anulează
                </button>
                <button className="btn" type="submit">Salvează</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
