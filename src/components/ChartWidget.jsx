import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
export default function ChartWidget({ simulatedYield }) {
  const data = [{ name: 'Baseline Yield', value: 100 }, { name: 'Simulated Yield', value: simulatedYield }];
  return <section className="h-80 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-base font-semibold">Yield comparison</h2><p className="mb-4 text-sm text-slate-500">Projected performance against the baseline yield index.</p><ResponsiveContainer width="100%" height="80%"><BarChart data={data}><CartesianGrid vertical={false} stroke="#e2e8f0" /><XAxis dataKey="name" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} /><Tooltip cursor={{ fill: '#f1f5f9' }} /><Bar dataKey="value" name="Yield index" fill="#059669" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></section>;
}
