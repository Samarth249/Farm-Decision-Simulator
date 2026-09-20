import { Link } from 'react-router-dom';
import { useScenarios } from '../context/ScenarioContext';

export default function Dashboard() {
  const { scenarios, loading, deleteScenario, duplicateScenario } = useScenarios();
  const active = scenarios.at(-1);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-white border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-emerald-600 text-[28px] animate-spin">refresh</span>
          <p className="text-slate-700 font-semibold text-base">Loading decision workspace from Fast-API backend...</p>
        </div>
      </div>
    );
  }

  if (!active) {
    return (
      <div className="space-y-6">
        <div>
          <span className="text-xs font-extrabold text-emerald-700 tracking-wider uppercase">
            DECISION OVERVIEW
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Farm Decision Overview</h1>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-200">
            <span className="material-symbols-outlined text-[28px]">psychology</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">No scenarios saved yet</h2>
          <p className="mx-auto max-w-xl text-sm text-slate-600">
            Start modeling your agricultural operational decisions by building your first scenario.
          </p>
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

  const kpis = [
    { label: 'Modeled Yield', value: `${active.result.yield} t/ha`, icon: 'eco', tone: 'emerald' },
    { label: 'Estimated Water Use', value: `${active.result.water} mm`, icon: 'opacity', tone: 'blue' },
    { label: 'Estimated Cost', value: `₹${active.result.cost.toLocaleString('en-IN')}`, icon: 'payments', tone: 'amber' },
    { label: 'Modeled Risk Level', value: `${active.result.riskLevel} Risk`, icon: 'shield', tone: 'rose' }
  ];

  const handleDuplicate = async (id, currentName) => {
    const newName = window.prompt('Enter title for duplicated scenario:', `${currentName} Copy`);
    if (!newName) return;
    await duplicateScenario(id, newName);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <span className="text-xs font-extrabold text-emerald-700 tracking-wider uppercase">
            ACTIVE DECISION SNAPSHOT
          </span>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {active.inputs.location} • {active.inputs.crop} • {active.inputs.area} acres
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{active.name}</h1>
        </div>

        <div className="flex gap-3">
          <Link
            to="/build"
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-white font-bold text-xs shadow-sm hover:bg-emerald-700 transition"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>+ New Scenario</span>
          </Link>
          <Link
            to="/compare"
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-bold text-xs text-slate-800 hover:bg-slate-50 transition"
          >
            <span className="material-symbols-outlined text-[18px]">compare_arrows</span>
            <span>Compare Scenarios</span>
          </Link>
        </div>
      </div>

      {/* Active Scenario KPI Overview */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>{kpi.label}</span>
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">{kpi.icon}</span>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-slate-900 tracking-tight">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Saved Scenarios Table */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-7 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Saved Farming Scenarios</h2>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {scenarios.length} Scenarios Saved
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase">
                <th className="pb-3">Scenario Name</th>
                <th className="pb-3">Crop</th>
                <th className="pb-3">Area</th>
                <th className="pb-3">Yield</th>
                <th className="pb-3">Profit</th>
                <th className="pb-3">Risk Level</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {scenarios.map((sc) => (
                <tr key={sc.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 font-bold text-slate-900">{sc.name}</td>
                  <td className="py-3.5 text-slate-600 font-medium">{sc.inputs.crop}</td>
                  <td className="py-3.5 text-slate-600 font-medium">{sc.inputs.area} ac</td>
                  <td className="py-3.5 font-extrabold text-emerald-700">{sc.result.yield} t/ha</td>
                  <td className="py-3.5 font-extrabold text-slate-900">₹{sc.result.profit.toLocaleString('en-IN')}</td>
                  <td className="py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                      sc.result.riskLevel === 'Low' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {sc.result.riskLevel} Risk
                    </span>
                  </td>
                  <td className="py-3.5 text-right space-x-3">
                    <Link to="/compare" className="text-emerald-700 font-bold hover:underline">
                      Compare
                    </Link>
                    <button
                      onClick={() => handleDuplicate(sc.id, sc.name)}
                      className="text-slate-700 font-medium hover:underline cursor-pointer"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => deleteScenario(sc.id)}
                      className="text-rose-600 font-medium hover:underline cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
