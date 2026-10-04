import { Bell, Database, LayoutDashboard, LogOut, ShieldCheck, UserCircle2 } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/records', label: 'Data Records', icon: Database },
  { to: '/add-record', label: 'Add Data', icon: ShieldCheck },
  { to: '/ml-predictions', label: 'ML Predictions', icon: ShieldCheck },
  { to: '/expiry-monitor', label: 'Expiry Monitor', icon: Database },
  { to: '/analytics', label: 'Analytics', icon: LayoutDashboard },
  { to: '/audit-logs', label: 'Audit Logs', icon: Bell },
  { to: '/demo/event-registration', label: 'Event Demo', icon: ShieldCheck },
  { to: '/settings', label: 'Settings', icon: UserCircle2 },
];

function Layout({ children, userName = 'Admin' }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('dataclock-user');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-72 flex-col bg-slate-950 p-6 text-slate-100 lg:flex">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-lg font-bold text-white">D</div>
          <div>
            <div className="text-xl font-bold">DataClock</div>
            <div className="text-xs text-slate-400">Privacy retention</div>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-violet-500 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">System status</p>
          <div className="mt-2 flex items-center gap-2 text-sm text-emerald-400">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            Operational
          </div>
        </div>
      </aside>

      <div className="flex-1">
        <header className="border-b border-slate-200 bg-white px-4 py-4 shadow-sm lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-100 p-2 lg:hidden">
                <Link to="/dashboard" className="text-lg font-bold text-slate-900">D</Link>
              </div>
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  placeholder="Search records, purpose or data type"
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-violet-300"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50">
                <Bell size={18} />
                <span className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">3</span>
              </button>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                  <UserCircle2 size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{userName}</p>
                  <p className="text-[11px] text-slate-500">Administrator</p>
                </div>
              </div>
              <button onClick={logout} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
