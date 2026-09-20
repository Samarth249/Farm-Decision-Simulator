export default function KPICard({ label, value, detail, tone = 'emerald', icon = 'eco' }) {
  const iconColors = {
    emerald: 'text-primary',
    blue: 'text-secondary',
    amber: 'text-outline',
    rose: 'text-primary'
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-label-md text-on-surface-variant">{label}</span>
        <span className={`material-symbols-outlined ${iconColors[tone] || 'text-primary'} text-[18px]`}>
          {icon}
        </span>
      </div>
      <div className="text-title-kpi text-on-surface mt-2 font-bold">{value}</div>
      <div className="mt-2.5 flex items-center gap-1.5">
        {detail && (
          <span className="inline-flex items-center text-label-xs font-semibold px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">
            {detail}
          </span>
        )}
      </div>
    </div>
  );
}
