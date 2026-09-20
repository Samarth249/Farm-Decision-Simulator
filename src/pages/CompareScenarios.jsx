import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useScenarios } from '../context/ScenarioContext';
import { compareScenariosApi } from '../services/api';

export default function CompareScenarios() {
  const { scenarios } = useScenarios();
  const [ids, setIds] = useState([scenarios[0]?.id, scenarios[1]?.id]);
  const [backendComparison, setBackendComparison] = useState(null);
  const [loading, setLoading] = useState(false);

  const chosen = ids.map((id) => scenarios.find((s) => s?.id === id)).filter(Boolean);

  useEffect(() => {
    let isMounted = true;
    if (chosen.length >= 2) {
      setLoading(true);
      const baseline = chosen[0];
      const alternatives = chosen.slice(1);

      compareScenariosApi(baseline, alternatives).then((res) => {
        if (isMounted) {
          setBackendComparison(res);
          setLoading(false);
        }
      });
    }
    return () => { isMounted = false; };
  }, [ids, scenarios]);

  if (scenarios.length < 2) {
    return (
      <div className="space-y-6">
        <div>
          <span className="text-xs font-extrabold text-emerald-700 tracking-wider uppercase">
            SCENARIO ANALYSIS
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Compare Farming Scenarios</h1>
        </div>
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm space-y-4">
          <span className="material-symbols-outlined text-slate-400 text-[32px]">compare_arrows</span>
          <h2 className="text-xl font-bold text-slate-900">More scenarios needed</h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            You need at least 2 saved scenarios to perform a side-by-side decision comparison.
          </p>
          <Link
            to="/build"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-bold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Build a Scenario</span>
          </Link>
        </section>
      </div>
    );
  }

  const metrics = [
    ['Estimated Yield (t/ha)', 'yield'],
    ['Water Consumption (mm)', 'water'],
    ['Total Production Cost (₹)', 'cost'],
    ['Gross Revenue (₹)', 'revenue'],
    ['Expected Net Profit (₹)', 'profit'],
    ['Composite Risk Level', 'riskLevel']
  ];

  const chartData = chosen.map((s) => ({
    name: s.name,
    yield: s.result.yield,
    water: s.result.water
  }));

  const [a, b] = chosen;
  const dominantFactors = backendComparison?.dominant_factors || [];
  const keyDifferences = backendComparison?.key_differences || [];
  const explanationText = backendComparison?.explanation || (b && a ? `Comparing ${b.name} against ${a.name}: Yield diff is ${(b.result.yield - a.result.yield).toFixed(1)} t/ha.` : '');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <span className="text-xs font-extrabold text-emerald-700 tracking-wider uppercase">
            SCENARIO COMPARISON MATRIX
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Side-by-Side Decision Analysis
          </h1>
        </div>
        {loading && (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            Computing Backend Deltas...
          </span>
        )}
      </div>

      {/* Scenario Selectors */}
      <div className="grid gap-5 sm:grid-cols-2">
        {ids.map((id, index) => (
          <div key={index} className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {index === 0 ? 'Baseline Scenario' : `Alternative Scenario ${index}`}
            </label>
            <select
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
              value={id || ''}
              onChange={(e) => setIds((cur) => cur.map((v, i) => i === index ? e.target.value : v))}
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.inputs.crop})</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Metric Comparison Table */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-7 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Financial &amp; Agronomic Metric Matrix</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase">
                <th className="pb-3">Metric</th>
                {chosen.map((s) => (
                  <th key={s.id} className="pb-3 text-slate-900 font-extrabold">{s.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {metrics.map(([label, key]) => (
                <tr key={key} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 font-semibold text-slate-600">{label}</td>
                  {chosen.map((s) => (
                    <td key={s.id} className="py-3.5 font-extrabold text-slate-900">
                      {key === 'riskLevel' ? (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                          s.result[key] === 'Low' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {s.result[key]} Risk
                        </span>
                      ) : (
                        typeof s.result[key] === 'number' ? s.result[key].toLocaleString('en-IN') : s.result[key]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recharts Bar Visualization */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-7 shadow-sm h-80">
        <h2 className="text-lg font-bold text-slate-900 mb-2">Yield &amp; Water Use Comparison</h2>
        <ResponsiveContainer width="100%" height="88%">
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="yield" name="Yield (t/ha)" fill="#059669" radius={[6, 6, 0, 0]} />
            <Bar dataKey="water" name="Water Use (mm)" fill="#0284c7" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Factor Attribution & Reasoning */}
      {a && b && (
        <article className="bg-gradient-to-br from-emerald-50/40 to-slate-50 border border-emerald-200/80 rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Why did the outcomes change?</h2>
            <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
              Factor Attribution Engine
            </span>
          </div>

          <p className="text-slate-800 font-medium whitespace-pre-line leading-relaxed text-sm">
            {explanationText}
          </p>

          {/* Key Differences Bullet Points */}
          {keyDifferences.length > 0 && (
            <div className="pt-4 border-t border-emerald-200/60">
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Key Takeaways:</p>
              <ul className="list-disc list-inside space-y-1.5 text-xs font-semibold text-slate-700">
                {keyDifferences.map((bullet, idx) => (
                  <li key={idx}>{bullet}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Model-Based Estimated Factor Attribution Bars */}
          {dominantFactors.length > 0 && (
            <div className="pt-4 border-t border-emerald-200/60">
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">Model-Based Factor Contributions:</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {dominantFactors.map((f, idx) => (
                  <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>{f.factor}</span>
                      <span className="text-emerald-700">{f.contribution_pct}% contribution</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-emerald-600 transition-all duration-500"
                        style={{ width: `${Math.min(100, f.contribution_pct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>
      )}
    </div>
  );
}
