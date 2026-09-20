import { Link } from 'react-router-dom';
import { useScenarios } from '../context/ScenarioContext';

export default function History() {
  const { scenarios, loading, loadError, duplicateScenario, deleteScenario } = useScenarios();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-white border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-emerald-600 text-[28px] animate-spin">refresh</span>
          <p className="text-slate-700 font-semibold text-base">Loading scenario history from Fast-API backend...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Scenario History</h1>
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-center shadow-sm space-y-3">
          <span className="material-symbols-outlined text-rose-500 text-[32px]">cloud_off</span>
          <h2 className="text-xl font-bold text-rose-900">Backend Unavailable</h2>
          <p className="text-sm text-rose-700 max-w-lg mx-auto">{loadError}</p>
        </div>
      </div>
    );
  }

  if (scenarios.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Scenario History</h1>
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm space-y-4">
          <span className="material-symbols-outlined text-slate-400 text-[32px]">history</span>
          <h2 className="text-xl font-bold text-slate-900">No scenario history yet</h2>
          <p className="text-sm text-slate-600">Build your first farm scenario to track historical decision iterations.</p>
          <Link
            to="/build"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-bold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Build First Scenario</span>
          </Link>
        </section>
      </div>
    );
  }

  const handleDuplicate = async (id, currentName) => {
    const newName = window.prompt('Enter name for duplicated scenario:', `${currentName} Copy`);
    if (!newName) return;
    await duplicateScenario(id, newName);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <span className="text-xs font-extrabold text-emerald-700 tracking-wider uppercase">HISTORICAL ARCHIVE</span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Scenario Iteration History</h1>
        </div>
        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          {scenarios.length} Scenarios Saved
        </span>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {scenarios.map((scenario) => (
          <article key={scenario.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{scenario.name}</h2>
              {scenario.result && (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                  scenario.result.riskLevel === 'Low' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {scenario.result.riskLevel} Risk
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 font-medium">
              {scenario.inputs.location} • {scenario.inputs.crop} • {scenario.inputs.area} acres
            </p>

            {scenario.result ? (
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <span>Yield: <b className="text-emerald-700 font-extrabold">{scenario.result.yield} t/ha</b></span>
                <span>Water: <b className="text-slate-900 font-bold">{scenario.result.water} mm</b></span>
                <span>Cost: <b className="text-slate-900 font-bold">₹{scenario.result.cost.toLocaleString('en-IN')}</b></span>
                <span>Profit: <b className="text-slate-900 font-bold">₹{scenario.result.profit.toLocaleString('en-IN')}</b></span>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
                Simulation result unavailable — backend may be offline.
              </div>
            )}

            <div className="flex items-center justify-between text-xs pt-2">
              <div className="flex gap-4">
                <Link to="/compare" className="text-emerald-700 font-bold hover:underline">
                  Compare
                </Link>
                <button
                  onClick={() => handleDuplicate(scenario.id, scenario.name)}
                  className="text-slate-700 font-bold hover:underline cursor-pointer"
                >
                  Duplicate
                </button>
              </div>

              <button
                onClick={() => deleteScenario(scenario.id)}
                className="text-rose-600 font-medium hover:underline cursor-pointer"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
