import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const data = [
  { month: 'Jun', temperature: 29, rainfall: 135 },
  { month: 'Jul', temperature: 27, rainfall: 210 },
  { month: 'Aug', temperature: 27, rainfall: 190 },
  { month: 'Sep', temperature: 28, rainfall: 145 },
  { month: 'Oct', temperature: 30, rainfall: 85 }
];

export default function Weather() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-label-eyebrow font-bold text-primary tracking-wider uppercase">
            HYDROLOGY &amp; MICROCLIMATE
          </span>
          <h1 className="text-headline-lg font-bold text-on-surface">Weather Conditions — Nanded, Maharashtra</h1>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container/50 px-3 py-1 text-xs font-semibold text-on-secondary-container">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          Simulated Climate Dataset
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Temperature Trend (°C)">
          <AreaChart data={data}>
            <CartesianGrid stroke="#e5eeff" strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis unit="°C" />
            <Tooltip />
            <Area dataKey="temperature" name="Avg Temp (°C)" stroke="#b15f00" fill="#ffdcc3" />
          </AreaChart>
        </ChartCard>

        <ChartCard title="Rainfall Distribution (mm)">
          <BarChart data={data}>
            <CartesianGrid stroke="#e5eeff" strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis unit=" mm" />
            <Tooltip />
            <Bar dataKey="rainfall" name="Rainfall (mm)" fill="#006948" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <article className="h-80 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm">
      <h2 className="font-semibold text-on-surface mb-3">{title}</h2>
      <ResponsiveContainer width="100%" height="88%">
        {children}
      </ResponsiveContainer>
    </article>
  );
}
