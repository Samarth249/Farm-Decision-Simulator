export default function KPICard({ label, value, detail, tone = 'emerald', icon = 'eco' }) {
  const iconColors = {
    emerald: 'text-emerald-600 bg-emerald-50',
    blue: 'text-sky-600 bg-sky-50',
    amber: 'text-amber-600 bg-amber-50',
    rose: 'text-rose-600 bg-rose-50'
  };

  const badgeTones = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-sky-50 text-sky-700 border-sky-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200'
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconColors[tone] || iconColors.emerald}`}>
          <span className="material-symbols-outlined text-[19px]">{icon}</span>
        </div>
      </div>

      <div className="mt-3">
        <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</div>
      </div>

      {detail && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5">
          <span className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full border ${badgeTones[tone] || badgeTones.emerald}`}>
            {detail}
          </span>
        </div>
      )}
    </div>
  );
}
