import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [passwords, setPasswords] = useState({});
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    is_superadmin: false,
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
    } catch (e) {
      setError(e?.response?.data?.message || 'Eroare la actualizarea parolei');
    }
  };

  const createUser = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      await api.post('/users', newUser);
      setMessage('Utilizator creat cu succes.');
      setNewUser({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        is_superadmin: false,
      });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Eroare la crearea utilizatorului');
    }
  };

  const toggleSuperadmin = async (user) => {
    setMessage('');
    setError('');

    try {
      await api.patch(`/users/${user.id}/superadmin`, { is_superadmin: !user.is_superadmin });
      setMessage('Rol utilizator actualizat.');
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Eroare la actualizarea rolului');
    }
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-xl font-bold">Users</h2>
        <p className="text-sm text-slate-500">Doar superadmin poate modifica parolele utilizatorilor.</p>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Adaugă utilizator</h3>
        <form className="grid md:grid-cols-5 gap-3" onSubmit={createUser}>
          <input
            className="input"
            placeholder="Nume"
            value={newUser.name}
            onChange={(event) => setNewUser((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
          <input
            className="input"
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
          <div className="flex items-center gap-3">
            <label className="text-sm flex items-center gap-2">
              <input
                type="checkbox"
                checked={newUser.is_superadmin}
                onChange={(event) => setNewUser((prev) => ({ ...prev, is_superadmin: event.target.checked }))}
              />
              Superadmin
            </label>
            <button className="btn" type="submit">Creează</button>
          </div>
        </form>
      </div>

      {message && <div className="card text-emerald-700">{message}</div>}
      {error && <div className="card text-rose-700">{error}</div>}

      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="card">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {user.is_superadmin && (
                  <span className="rounded bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700">SUPERADMIN</span>
                )}
                <button className="rounded bg-slate-200 px-2 py-1 text-xs" type="button" onClick={() => toggleSuperadmin(user)}>
                  {user.is_superadmin ? 'Scoate superadmin' : 'Fă superadmin'}
                </button>
              </div>
            </div>

            <form className="grid md:grid-cols-3 gap-3" onSubmit={(event) => updatePassword(event, user.id)}>
              <input
                className="input"
                type="password"
                placeholder="Parolă nouă"
                value={passwords[user.id]?.password || ''}
                onChange={(event) => onChange(user.id, 'password', event.target.value)}
                minLength={8}
                required
              />
              <input
                className="input"
                type="password"
                placeholder="Confirmare parolă"
                value={passwords[user.id]?.password_confirmation || ''}
                onChange={(event) => onChange(user.id, 'password_confirmation', event.target.value)}
                minLength={8}
                required
              />
              <button className="btn" type="submit">Actualizează parola</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
