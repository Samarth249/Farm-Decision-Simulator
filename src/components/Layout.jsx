import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  const navigate = useNavigate();

  return (
    <div className="bg-slate-50/70 text-slate-900 antialiased min-h-screen flex">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Workstation Shell */}
      <div className="ml-64 flex-1 flex flex-col min-w-0">
        {/* Top Sticky Decision Support Header Shell */}
        <header className="h-16 w-full sticky top-0 bg-white/95 backdrop-blur-md flex items-center justify-between px-8 z-30 border-b border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-slate-900 tracking-tight">AgriSim Decision Workspace</span>
            <div className="h-4 w-px bg-slate-300"></div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Sugarcane (2.5 ac)
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">Kharif 2026</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-[19px]">notifications</span>
            </button>
            <button
              className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
              title="Parameters"
            >
              <span className="material-symbols-outlined text-[19px]">tune</span>
            </button>

            <div className="h-5 w-px bg-slate-200 mx-1"></div>

            <button
              onClick={() => navigate('/build')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-bold hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              <span>Run Simulation</span>
            </button>

            <button
              onClick={() => navigate('/build')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm transition-all active:scale-98 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">bookmark</span>
              <span>Save Scenario</span>
            </button>
          </div>
        </header>

        {/* Content Area with Increased Horizontal Breathing Room */}
        <main className="p-8 md:p-10 max-w-[1760px] w-full mx-auto space-y-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
