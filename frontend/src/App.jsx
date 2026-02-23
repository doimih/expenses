import { NavLink, Route, Routes } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Expenses from './pages/Expenses';
import Users from './pages/Users';

function Layout({ children, onLogout, user }) {
  const navClass = ({ isActive }) =>
    `px-3 py-2 rounded whitespace-nowrap ${isActive ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700'}`;

  const resetAppCache = async () => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if ('caches' in window) {
      const keys = await window.caches.keys();
      await Promise.all(keys.map((key) => window.caches.delete(key)));
    }

    window.location.reload();
  };

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      <header className="card flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Expenses Manager</h1>
          <p className="text-sm text-slate-500">{user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-md px-3 py-2 text-sm font-semibold bg-slate-200 text-slate-700" onClick={resetAppCache}>Reset cache</button>
          <button className="btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <div className="overflow-x-auto pb-1">
        <nav className="flex gap-2 min-w-max">
          <NavLink to="/" className={navClass} end>Dashboard</NavLink>
          <NavLink to="/expenses" className={navClass}>Cheltuieli</NavLink>
          <NavLink to="/categories" className={navClass}>Categorii</NavLink>
          <NavLink to="/users" className={navClass}>Users</NavLink>
        </nav>
      </div>

      {children}
    </div>
  );
}

export default function App() {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return <div className="min-h-screen grid place-items-center">Loading...</div>;
  }

  if (!user) {
    return <Login onLogin={login} />;
  }

  return (
    <Layout user={user} onLogout={logout}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/users" element={<Users />} />
      </Routes>
    </Layout>
  );
}
