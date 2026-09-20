import { NavLink, useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'bar_chart' },
  { to: '/build', label: 'Scenario Builder', icon: 'psychology' },
  { to: '/compare', label: 'Compare', icon: 'compare_arrows' },
  { to: '/weather', label: 'Weather', icon: 'cloud' },
  { to: '/history', label: 'History', icon: 'history' }
];

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 z-40 px-4 py-5 flex flex-col justify-between bg-surface-container-lowest border-r border-outline-variant/30 select-none">
      <div className="flex flex-col gap-6">
        {/* Logo Branding */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-sm">
            <span className="material-symbols-outlined text-[20px]">psychology</span>
          </div>
          <div>
            <h1 className="text-headline-sm font-bold text-primary tracking-tight leading-none">AgriSim</h1>
            <p className="text-body-sm text-outline mt-0.5">Farm Scenario Simulator</p>
          </div>
        </div>

        {/* Action Button CTA */}
        <button
          onClick={() => navigate('/build')}
          className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary font-medium text-label-md py-2.5 px-4 rounded-lg hover:bg-primary-container transition-all duration-150 active:scale-98 shadow-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>New Simulation</span>
        </button>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-label-md font-medium transition-colors ${
                  isActive
                    ? 'bg-secondary-container text-on-secondary-container font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container-low'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer Nav Links */}
      <div className="pt-4 border-t border-outline-variant/30 flex flex-col gap-1">
        <a
          className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low text-label-md transition-colors"
          href="https://github.com/Samarth249/Farm-Decision-Simulator"
          target="_blank"
          rel="noreferrer"
        >
          <span className="material-symbols-outlined text-[18px]">menu_book</span>
          <span>Documentation</span>
        </a>
        <div className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-outline">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>FastAPI Engine Online</span>
        </div>
      </div>
    </aside>
  );
}
