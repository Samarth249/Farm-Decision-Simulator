import { NavLink, useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'bar_chart' },
  { to: '/build', label: 'Scenario Builder', icon: 'psychology' },
  { to: '/compare', label: 'Compare Scenarios', icon: 'compare_arrows' },
  { to: '/weather', label: 'Weather', icon: 'cloud' },
  { to: '/history', label: 'History', icon: 'history' }
];

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 z-40 px-4 py-6 flex flex-col justify-between bg-white border-r border-slate-200 shadow-sm select-none">
      <div className="flex flex-col gap-6">
        {/* Logo Branding */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <span className="material-symbols-outlined text-[22px]">psychology</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">AgriSim</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">Farm Decision Simulator</p>
          </div>
        </div>

        {/* Action Button CTA */}
        <button
          onClick={() => navigate('/build')}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white font-semibold text-sm py-2.5 px-4 rounded-xl hover:bg-emerald-700 transition-all duration-150 active:scale-98 shadow-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>New Simulation</span>
        </button>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5 pt-2">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-600 shadow-xs'
                    : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer Links & Engine Status */}
      <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
        <a
          className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-slate-600 hover:bg-slate-50 text-xs font-medium transition-colors"
          href="https://github.com/Samarth249/Farm-Decision-Simulator"
          target="_blank"
          rel="noreferrer"
        >
          <span className="material-symbols-outlined text-[18px]">menu_book</span>
          <span>Documentation</span>
        </a>
        <div className="flex items-center gap-2 px-3.5 py-1 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-medium text-slate-700">FastAPI Simulation Core</span>
        </div>
      </div>
    </aside>
  );
}
