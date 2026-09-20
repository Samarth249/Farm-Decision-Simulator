import { Link } from 'react-router-dom';
import { useScenarios } from '../context/ScenarioContext';

export default function Dashboard() {
  const { scenarios, deleteScenario } = useScenarios();
  const active = scenarios.at(-1);

  if (!active) {
    return (
      <div className="space-y-6">
        <div>
          <span className="text-label-eyebrow font-bold text-primary tracking-wider uppercase">
            DECISION OVERVIEW
          </span>
          <h1 className="text-headline-lg font-bold text-on-surface">Farm Decision Overview</h1>
        </div>

        <section className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-8 text-center shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-secondary-container/50 text-on-secondary-container mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px]">psychology</span>
          </div>
          <h2 className="text-headline-md font-semibold text-on-surface">No scenarios created yet</h2>
          <p className="mx-auto max-w-xl text-body-md text-outline">
            Start modeling your agricultural operational decisions by constructing your first scenario.
          </p>
          <Link
            to="/build"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-on-primary shadow-sm hover:bg-primary-container transition"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Build First Scenario</span>
          </Link>
        </section>
      </div>
    );
  }

  const kpis = [
    { label: 'Estimated Yield', value: `${active.result.yield} t/ha`, icon: 'eco', tone: 'emerald' },
    { label: 'Water Consumed', value: `${active.result.water} mm`, icon: 'opacity', tone: 'blue' },
    { label: 'Total Production Cost', value: `₹${active.result.cost.toLocaleString('en-IN')}`, icon: 'payments', tone: 'amber' },
    { label: 'Composite Risk Level', value: active.result.riskLevel, icon: 'shield', tone: 'rose' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-label-eyebrow font-bold text-primary tracking-wider uppercase">
            ACTIVE DECISION SNAPSHOT
          </span>
          <p className="text-body-sm text-outline mt-0.5">
            {active.inputs.location} • {active.inputs.crop} • {active.inputs.area} acres
          </p>
          <h1 className="text-headline-lg font-bold text-on-surface">{active.name}</h1>
        </div>

        <div className="flex gap-3">
          <Link
            to="/build"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-on-primary font-medium shadow-sm hover:bg-primary-container transition"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>+ New Scenario</span>
          </Link>
          <Link
            to="/compare"
            className="flex items-center gap-2 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-4 py-2 font-medium text-on-surface hover:bg-surface-container-low transition"
          >
            <span className="material-symbols-outlined text-[18px]">compare_arrows</span>
            <span>Compare Scenarios</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-body-sm text-outline">
              <span>{kpi.label}</span>
              <span className="material-symbols-outlined text-primary text-[20px]">{kpi.icon}</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-on-surface">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Saved Scenarios Table */}
      <section className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-headline-sm font-semibold text-on-surface">Saved Farming Scenarios</h2>
          <span className="text-label-xs bg-secondary-container/50 text-on-secondary-container px-2.5 py-1 rounded font-semibold">
            {scenarios.length} Saved
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-md">
            <thead>
              <tr className="border-b border-outline-variant/30 text-label-md text-outline">
                <th className="pb-3">Scenario Name</th>
                <th className="pb-3">Crop</th>
                <th className="pb-3">Area</th>
                <th className="pb-3">Yield</th>
                <th className="pb-3">Profit</th>
                <th className="pb-3">Risk</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {scenarios.map((sc) => (
                <tr key={sc.id} className="hover:bg-surface-container-low/50 transition">
                  <td className="py-3.5 font-semibold text-on-surface">{sc.name}</td>
                  <td className="py-3.5 text-on-surface-variant">{sc.inputs.crop}</td>
                  <td className="py-3.5 text-on-surface-variant">{sc.inputs.area} ac</td>
                  <td className="py-3.5 font-medium text-primary">{sc.result.yield} t/ha</td>
                  <td className="py-3.5 font-semibold text-on-surface">₹{sc.result.profit.toLocaleString('en-IN')}</td>
                  <td className="py-3.5">
                    <span className="rounded-full bg-secondary-container/40 text-on-secondary-container px-2.5 py-1 text-xs font-semibold">
                      {sc.result.riskLevel}
                    </span>
                  </td>
                  <td className="py-3.5 text-right space-x-3">
                    <Link to="/compare" className="text-primary font-semibold hover:underline">
                      Compare
                    </Link>
                    <button
                      onClick={() => deleteScenario(sc.id)}
                      className="text-error font-medium hover:underline cursor-pointer"
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
