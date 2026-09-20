import { Link } from 'react-router-dom';
import { useScenarios } from '../context/ScenarioContext';

export default function History() {
  const { scenarios, saveScenario, deleteScenario } = useScenarios();

  if (scenarios.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-headline-lg font-bold text-on-surface">Scenario History</h1>
        <section className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-8 text-center shadow-sm space-y-4">
          <span className="material-symbols-outlined text-outline text-[32px]">history</span>
          <h2 className="text-headline-md font-semibold text-on-surface">No scenario history yet</h2>
          <p className="text-body-md text-outline">Build your first farm scenario to track historical decision iterations.</p>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-label-eyebrow font-bold text-primary tracking-wider uppercase">HISTORICAL ARCHIVE</span>
          <h1 className="text-headline-lg font-bold text-on-surface">Scenario Iteration History</h1>
        </div>
        <span className="text-body-sm text-outline font-medium">{scenarios.length} Scenarios Saved</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {scenarios.map((scenario) => (
          <article key={scenario.id} className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-headline-sm font-semibold text-on-surface">{scenario.name}</h2>
              <span className="rounded-full bg-secondary-container/40 text-on-secondary-container px-2.5 py-1 text-xs font-semibold">
                {scenario.result.riskLevel} Risk
              </span>
            </div>

            <p className="text-body-sm text-outline">
              {scenario.inputs.location} • {scenario.inputs.crop} • {scenario.inputs.area} acres
            </p>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-body-sm">
              <span>Yield: <b className="text-primary">{scenario.result.yield} t/ha</b></span>
              <span>Water: <b className="text-on-surface">{scenario.result.water} mm</b></span>
              <span>Cost: <b className="text-on-surface">₹{scenario.result.cost.toLocaleString('en-IN')}</b></span>
              <span>Profit: <b className="text-on-surface">₹{scenario.result.profit.toLocaleString('en-IN')}</b></span>
            </div>

            <div className="flex gap-3 text-label-md pt-1">
              <Link to="/compare" className="text-primary font-semibold hover:underline">
                View / Compare
              </Link>
              <button
                onClick={() => saveScenario({ ...scenario, name: `${scenario.name} Copy` })}
                className="text-secondary font-medium hover:underline cursor-pointer"
              >
                Duplicate
              </button>
              <button
                onClick={() => deleteScenario(scenario.id)}
                className="text-error font-medium hover:underline cursor-pointer ml-auto"
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
