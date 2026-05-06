import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Expenses from './pages/Expenses';
import Users from './pages/Users';

const adminNavItems = [
  { to: '/', label: 'Dashboard', section: 'Overview' },
  { to: '/users', label: 'Users', section: 'Management' },
  { to: '/expenses', label: 'Expenses', section: 'Management' },
  { to: '/categories', label: 'Categories', section: 'Management' },
];

const userNavItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/expenses', label: 'Expenses' },
  { to: '/categories', label: 'Categories' },
];

function getUserLabel(user) {
  return `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.name || user?.email || 'User';
}

function BottomNav({ items }) {
  const location = useLocation();

  return (
    <div className="fixed inset-x-3 bottom-3 z-30 rounded-2xl border border-black/5 bg-white/95 p-2 shadow-lg backdrop-blur md:hidden">
      <nav className="grid grid-cols-3 gap-2">
        {items.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`nav-pill justify-center ${isActive ? 'nav-pill-active' : 'text-slate-500'}`}
            >
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

function AdminLayout({ children, onLogout, user }) {
  const location = useLocation();

  const sectionOrder = ['Overview', 'Management'];

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
    <div className="app-shell bg-[var(--color-bg)] md:grid md:min-h-screen md:grid-cols-[208px_minmax(0,1fr)]">
      <aside className="hidden border-r border-black/5 bg-white md:flex md:flex-col md:justify-between">
        <div>
          <div className="flex items-center gap-3 border-b border-black/5 px-5 py-5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent)]">E</span>
            <div>
              <p className="text-lg font-medium text-slate-900">Expenses</p>
              <span className="tag-chip">ADMIN</span>
            </div>
          </div>

          <div className="space-y-6 px-4 py-5">
            {sectionOrder.map((section) => {
              const items = adminNavItems.filter((item) => item.section === section);
              return (
                <div key={section} className="space-y-3">
                  <p className="panel-label">{section}</p>
                  <nav className="space-y-1">
                    {items.map((item) => {
                      const isActive = location.pathname === item.to;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          className={`flex items-center justify-between rounded-xl px-3 py-3 text-[14px] transition ${isActive ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-slate-700 hover:bg-stone-50'}`}
                        >
                          <span>{item.label}</span>
                          {item.label === 'Users' && <span className="rounded-full border border-black/5 px-2 py-0.5 text-[11px] text-slate-500">live</span>}
                        </NavLink>
                      );
                    })}
                  </nav>
                </div>
              );
            })}

            <div className="space-y-3">
              <p className="panel-label">System</p>
              <div className="space-y-1 text-[14px] text-slate-500">
                <div className="rounded-xl px-3 py-3">System logs</div>
                <div className="rounded-xl px-3 py-3">Settings</div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-black/5 px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--accent)] text-sm font-semibold text-white">
              {getUserLabel(user).slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium text-slate-900">{getUserLabel(user)}</p>
              <p className="truncate text-[12px] text-slate-500">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 p-4 pb-24 md:p-0 md:pb-0">
        <div className="mx-auto flex min-h-screen max-w-[1120px] flex-col gap-4 md:p-4">
          <header className="app-panel flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div>
              <h1 className="text-[15px] font-medium leading-tight text-slate-900">Admin dashboard</h1>
            </div>
            <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
              <input className="input max-w-[280px]" placeholder="Search users, expenses..." />
              <button className="rounded-xl border border-black/10 px-4 py-2 text-[14px] font-medium text-slate-700">Export CSV</button>
              <button className="icon-button" type="button" onClick={resetAppCache} title="Reset cache">↺</button>
              <button className="icon-button" type="button" onClick={onLogout} title="Logout">⎋</button>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--accent)] text-sm font-semibold text-white">
                {getUserLabel(user).slice(0, 2).toUpperCase()}
              </span>
            </div>
          </header>
          <div className="flex-1">{children}</div>
        </div>
      </main>

      <BottomNav items={adminNavItems.slice(0, 3)} />
    </div>
  );
}

function UserLayout({ children, onLogout, user }) {
  return (
    <div className="app-shell bg-[var(--color-bg)]">
      <div className="mx-auto flex min-h-screen max-w-[1180px] flex-col gap-4 px-4 py-4 pb-24 md:px-5 md:py-5 md:pb-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="panel-label">Expenses</p>
            <h1 className="text-[16px] font-medium text-slate-900">{getUserLabel(user)}</h1>
            <p className="text-[13px] text-slate-500">{user?.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <nav className="hidden items-center gap-2 md:flex">
              {userNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `nav-pill ${isActive ? 'nav-pill-active' : 'border border-black/5 bg-white text-slate-600'}`}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <span className="tag-chip">{user?.role === 'visitor' ? 'VISITOR' : 'USER'}</span>
            <button className="icon-button" type="button" onClick={onLogout} title="Logout">⎋</button>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>

      <BottomNav items={userNavItems} />
    </div>
  );
}

export default function App() {
  const { user, loading, login, register, logout } = useAuth();

  if (loading) {
    return <div className="min-h-screen grid place-items-center">Loading...</div>;
  }

  if (!user) {
    return <Login onLogin={login} onRegister={register} />;
  }

  const shell = user?.role === 'superadmin'
    ? <AdminLayout user={user} onLogout={logout} />
    : <UserLayout user={user} onLogout={logout} />;

  return (
    (() => {
      const ShellComponent = user?.role === 'superadmin' ? AdminLayout : UserLayout;

      return (
        <ShellComponent user={user} onLogout={logout}>
          <Routes>
            {user?.role === 'superadmin' ? (
              <>
                <Route path="/" element={<Dashboard user={user} />} />
                <Route path="/expenses" element={<Expenses user={user} />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/users" element={<Users />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Expenses user={user} />} />
                <Route path="/expenses" element={<Expenses user={user} />} />
                <Route path="/categories" element={<Categories />} />
              </>
            )}
          </Routes>
        </ShellComponent>
      );
    })()
  );
}
