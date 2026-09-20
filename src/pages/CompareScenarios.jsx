import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useScenarios } from '../context/ScenarioContext';
import { compareScenariosApi } from '../services/api';

export default function CompareScenarios() {
  const { scenarios } = useScenarios();
  const [ids, setIds] = useState([scenarios[0]?.id, scenarios[1]?.id]);
  const [backendComparison, setBackendComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [compareError, setCompareError] = useState(null);

  const chosen = ids.map((id) => scenarios.find((s) => s?.id === id)).filter(Boolean);

  useEffect(() => {
    let isMounted = true;
    if (chosen.length >= 2) {
      setLoading(true);
      setCompareError(null);
      const baseline = chosen[0];
      const alternatives = chosen.slice(1);

      compareScenariosApi(baseline, alternatives).then((res) => {
        if (isMounted) {
          setBackendComparison(res);
          setLoading(false);
        }
      }).catch((err) => {
        if (isMounted) {
          setCompareError(`Comparison failed: ${err.message}`);
          setBackendComparison(null);
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

  const [a, b] = chosen;

  // Chart data for separate visualizations
  const yieldChartData = chosen.filter(s => s?.result).map(s => ({
    name: s.name,
    yield: s.result.yield
  }));

  const waterChartData = chosen.filter(s => s?.result).map(s => ({
    name: s.name,
    water: s.result.water
  }));

  // Calculate deltas between Baseline (A) and Alternative (B)
  const calcDelta = (key, unit = '', isCurrency = false) => {
    if (!a?.result || !b?.result) return null;
    const valA = a.result[key] || 0;
    const valB = b.result[key] || 0;
    const diff = valB - valA;
    const sign = diff > 0 ? '+' : '';
    if (isCurrency) {
      return `${sign}₹${Math.abs(diff).toLocaleString('en-IN')}${diff < 0 ? ' less' : ''}`;
    }
    return `${sign}${diff.toFixed(1)} ${unit}`;
  };

  const dominantFactors = backendComparison?.dominant_factors || [];
  const keyDifferences = backendComparison?.key_differences || [];
  const explanationText = backendComparison?.explanation || null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <span className="text-xs font-extrabold text-emerald-700 tracking-wider uppercase">
            SCENARIO COMPARISON MATRIX
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Side-by-Side Decision Analysis
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Evaluate trade-offs between farming decision scenarios.
          </p>
        </div>
        {loading && (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            Computing Backend Comparison...
          </span>
        )}
        {compareError && (
          <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200">
            {compareError}
          </span>
        )}
      </div>

      {/* Selectors Grid */}
      <div className="grid gap-5 sm:grid-cols-2">
        {ids.map((id, index) => (
          <div key={index} className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {index === 0 ? 'Baseline Scenario (Scenario A)' : `Alternative Scenario (Scenario B)`}
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

      {/* Metrics Comparison Matrix */}
      {a?.result && b?.result && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">Modeled Outcome Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase">
                  <th className="pb-3">Metric</th>
                  <th className="pb-3 text-slate-900 font-extrabold">{a.name} (A)</th>
                  <th className="pb-3 text-slate-900 font-extrabold">{b.name} (B)</th>
                  <th className="pb-3 text-emerald-800 font-extrabold">Difference (B − A)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                <tr className="hover:bg-slate-50/70 transition">
                  <td className="py-3 font-semibold text-slate-700">Modeled Yield (t/ha)</td>
                  <td className="py-3 font-extrabold text-slate-900">{a.result.yield} t/ha</td>
                  <td className="py-3 font-extrabold text-slate-900">{b.result.yield} t/ha</td>
                  <td className="py-3 font-bold text-emerald-700">{calcDelta('yield', 't/ha')}</td>
                </tr>
                <tr className="hover:bg-slate-50/70 transition">
                  <td className="py-3 font-semibold text-slate-700">Estimated Water Use (mm)</td>
                  <td className="py-3 font-extrabold text-slate-900">{a.result.water} mm</td>
                  <td className="py-3 font-extrabold text-slate-900">{b.result.water} mm</td>
                  <td className="py-3 font-bold text-sky-700">{calcDelta('water', 'mm')}</td>
                </tr>
                <tr className="hover:bg-slate-50/70 transition">
                  <td className="py-3 font-semibold text-slate-700">Estimated Production Cost (₹)</td>
                  <td className="py-3 font-extrabold text-slate-900">₹{a.result.cost.toLocaleString('en-IN')}</td>
                  <td className="py-3 font-extrabold text-slate-900">₹{b.result.cost.toLocaleString('en-IN')}</td>
                  <td className="py-3 font-bold text-slate-700">{calcDelta('cost', '', true)}</td>
                </tr>
                <tr className="hover:bg-slate-50/70 transition">
                  <td className="py-3 font-semibold text-slate-700">Gross Revenue (₹)</td>
                  <td className="py-3 font-extrabold text-slate-900">₹{a.result.revenue.toLocaleString('en-IN')}</td>
                  <td className="py-3 font-extrabold text-slate-900">₹{b.result.revenue.toLocaleString('en-IN')}</td>
                  <td className="py-3 font-bold text-slate-700">{calcDelta('revenue', '', true)}</td>
                </tr>
                <tr className="hover:bg-slate-50/70 transition">
                  <td className="py-3 font-semibold text-slate-700">Modeled Net Profit (₹)</td>
                  <td className="py-3 font-extrabold text-emerald-700">₹{a.result.profit.toLocaleString('en-IN')}</td>
                  <td className="py-3 font-extrabold text-emerald-700">₹{b.result.profit.toLocaleString('en-IN')}</td>
                  <td className="py-3 font-bold text-emerald-700">{calcDelta('profit', '', true)}</td>
                </tr>
                <tr className="hover:bg-slate-50/70 transition">
                  <td className="py-3 font-semibold text-slate-700">Modeled Risk Level</td>
                  <td className="py-3 font-bold text-slate-900">{a.result.riskLevel} ({a.result.risk}/100)</td>
                  <td className="py-3 font-bold text-slate-900">{b.result.riskLevel} ({b.result.risk}/100)</td>
                  <td className="py-3 font-bold text-slate-700">
                    {b.result.risk - a.result.risk > 0 ? `+${b.result.risk - a.result.risk} score` : `${b.result.risk - a.result.risk} score`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Side-by-Side Visual Bar Charts (Separate axes to avoid mixing t/ha and mm) */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-72 flex flex-col justify-between">
          <h3 className="text-base font-bold text-slate-900">Yield Comparison (t/ha)</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={yieldChartData}>
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis unit=" t/ha" tick={{ fontSize: 12 }} stroke="#059669" />
              <Tooltip />
              <Bar dataKey="yield" name="Modeled Yield (t/ha)" fill="#059669" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-72 flex flex-col justify-between">
          <h3 className="text-base font-bold text-slate-900">Water Consumption (mm)</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={waterChartData}>
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis unit=" mm" tick={{ fontSize: 12 }} stroke="#0284c7" />
              <Tooltip />
              <Bar dataKey="water" name="Water Consumed (mm)" fill="#0284c7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Factor Sensitivity & Reasoning */}
      {a && b && (
        <article className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Why did outcomes change?</h2>
              <p className="text-xs text-slate-600 mt-0.5">Backend factor attribution and narrative explanation</p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
              Modeled Factor Sensitivity
            </span>
          </div>

          {explanationText && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">AI Narrative Explanation:</p>
              <p className="text-slate-800 font-medium whitespace-pre-line leading-relaxed text-sm">
                {explanationText}
              </p>
            </div>
          )}

          {/* Key Differences */}
          {keyDifferences.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Key Takeaways:</p>
              <ul className="list-disc list-inside space-y-1.5 text-xs font-semibold text-slate-700">
                {keyDifferences.map((bullet, idx) => (
                  <li key={idx}>{bullet}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Factor Attribution Sensitivity Bars */}
          {dominantFactors.length > 0 && (
            <div className="pt-2 space-y-3">
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Modeled Factor Sensitivity:</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {dominantFactors.map((f, idx) => (
                  <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>{f.factor}</span>
                      <span className="text-emerald-700">
                        {f.contribution_pct > 0 ? `${f.contribution_pct}% contribution` : 'Not modeled by current engine'}
                      </span>
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
