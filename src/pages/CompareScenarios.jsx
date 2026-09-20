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
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold">Compare Farming Scenarios</h1>
        <section className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">More scenarios needed</h2>
          <p className="mt-3 text-slate-600">You need at least 2 saved scenarios to perform a side-by-side decision comparison.</p>
          <Link to="/build" className="mt-6 inline-block rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700 shadow-sm transition">
            Build a Scenario
          </Link>
        </section>
      </div>
    );
  }

  const metrics = [
    ['Estimated Yield (t/ha)', 'yield'],
    ['Water Consumption (mm)', 'water'],
    ['Total Cost (₹)', 'cost'],
    ['Revenue (₹)', 'revenue'],
    ['Net Profit (₹)', 'profit'],
    ['Risk Level', 'riskLevel']
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
    <div className="mx-auto max-w-7xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Side-by-Side Scenario Comparison</h1>
        {loading && <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Analyzing backend deltas...</span>}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {ids.map((id, index) => (
          <div key={index} className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">
              {index === 0 ? 'Baseline Scenario' : `Alternative Scenario ${index}`}
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white p-3 font-medium shadow-sm focus:border-emerald-500 focus:outline-none"
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

      {/* Comparison Table */}
      <section className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Financial &amp; Agronomic Metric Matrix</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-sm font-semibold text-slate-600">
              <th className="py-3">Metric</th>
              {chosen.map((s) => (
                <th key={s.id} className="py-3">{s.name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {metrics.map(([label, key]) => (
              <tr key={key} className="hover:bg-slate-50">
                <td className="py-3 font-medium text-slate-600">{label}</td>
                {chosen.map((s) => (
                  <td key={s.id} className="py-3 font-semibold text-slate-900">
                    {key === 'riskLevel' ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        {s.result[key]}
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
      </section>

      {/* Bar Chart Visualization */}
      <div className="mt-6 h-80 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">Yield and Water Consumption Comparison</h2>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="yield" name="Yield (t/ha)" fill="#059669" radius={[4, 4, 0, 0]} />
            <Bar dataKey="water" name="Water Use (mm)" fill="#0284c7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Factor Attribution & Scientific Reasoning */}
      {a && b && (
        <article className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Why did the results change?</h2>
            <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
              Factor Attribution Engine
            </span>
          </div>

          <p className="text-slate-800 font-medium whitespace-pre-line leading-relaxed">
            {explanationText}
          </p>

          {/* Key Differences Bullet Points */}
          {keyDifferences.length > 0 && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Key Scenario Takeaways:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                {keyDifferences.map((bullet, idx) => (
                  <li key={idx}>{bullet}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Model-Based Estimated Factor Attribution Bars */}
          {dominantFactors.length > 0 && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Model-Based Contributing Factors:</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {dominantFactors.map((f, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{f.factor}</span>
                      <span className="text-blue-600">{f.contribution_pct}% contribution</span>
                    </div>
                    <div className="mt-1.5 h-2 rounded bg-slate-100 overflow-hidden">
                      <div
                        className="h-2 rounded bg-blue-600 transition-all duration-500"
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
