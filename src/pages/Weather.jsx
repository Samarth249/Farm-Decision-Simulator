import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const climateData = [
  { month: 'Jun', temperature: 29, rainfall: 135 },
  { month: 'Jul', temperature: 27, rainfall: 210 },
  { month: 'Aug', temperature: 27, rainfall: 190 },
  { month: 'Sep', temperature: 28, rainfall: 145 },
  { month: 'Oct', temperature: 30, rainfall: 85 }
];

export default function Weather() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <span className="text-xs font-extrabold text-emerald-700 tracking-wider uppercase">
            HYDROLOGY &amp; MICROCLIMATE
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Weather Conditions — Nanded, Maharashtra
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Historical baseline climate dataset (1991–2020) used for scenario simulation models.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-slate-500"></span>
          Historical Baseline Dataset
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Temperature Trend (°C)">
          <AreaChart data={climateData}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis unit="°C" />
            <Tooltip />
            <Area dataKey="temperature" name="Avg Temp (°C)" stroke="#b15f00" fill="#ffdcc3" />
          </AreaChart>
        </ChartCard>

        <ChartCard title="Rainfall Distribution (mm)">
          <BarChart data={climateData}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis unit=" mm" />
            <Tooltip />
            <Bar dataKey="rainfall" name="Rainfall (mm)" fill="#059669" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <article className="h-80 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
      <h2 className="font-bold text-slate-900 text-base mb-2">{title}</h2>
      <ResponsiveContainer width="100%" height="88%">
        {children}
      </ResponsiveContainer>
    </article>
  );
}
