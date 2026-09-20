export default function KPICard({ label, value, detail, tone = 'emerald' }) {
  const tones = { emerald: 'bg-emerald-50 text-emerald-700', blue: 'bg-blue-50 text-blue-700', amber: 'bg-amber-50 text-amber-700', rose: 'bg-rose-50 text-rose-700' };
  return <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p>{detail && <p className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>{detail}</p>}</article>;
}
