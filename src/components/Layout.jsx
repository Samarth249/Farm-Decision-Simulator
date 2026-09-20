import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen flex">
      {/* Left Lateral SideNav Shell */}
      <Sidebar />

      {/* Main Workstation View Area */}
      <div className="ml-64 flex-1 flex flex-col min-w-0">
        {/* Top Sticky Header Shell */}
        <header className="h-16 w-full sticky top-0 bg-surface-container-lowest/90 backdrop-blur-md flex items-center justify-between px-8 z-30 border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <span className="text-headline-sm font-semibold text-on-surface">AgriSim Decision Workspace</span>
            <div className="h-4 w-px bg-outline-variant/50"></div>
            <div className="flex items-center gap-2 text-label-md">
              <span className="text-primary font-semibold">Sugarcane (2.5 ac)</span>
              <span className="text-outline-variant">•</span>
              <span className="text-on-surface-variant">Kharif 2026</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="w-9 h-9 rounded-lg border border-outline-variant/40 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors cursor-pointer"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-[19px]">notifications</span>
            </button>
            <button
              className="w-9 h-9 rounded-lg border border-outline-variant/40 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors cursor-pointer"
              title="Parameters"
            >
              <span className="material-symbols-outlined text-[19px]">tune</span>
            </button>
            
            <div className="h-6 w-px bg-outline-variant/40 mx-1"></div>

            <button
              onClick={() => navigate('/build')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-outline-variant/50 text-on-surface font-medium text-label-md hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              <span>Run Simulation</span>
            </button>
            <button
              onClick={() => navigate('/build')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-medium text-label-md hover:bg-primary-container shadow-sm transition-all active:scale-98 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">bookmark</span>
              <span>Build Scenario</span>
            </button>
          </div>
        </header>

        {/* Content Workspace */}
        <main className="p-8 max-w-[1600px] w-full mx-auto space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
