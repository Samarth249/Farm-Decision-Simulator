import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScenarios } from '../context/ScenarioContext';
import { runSimulation } from '../services/api';
import KPICard from '../components/KPICard';

const locations = ['Nanded, Maharashtra', 'Nashik, Maharashtra', 'Kolhapur, Maharashtra', 'Belagavi, Karnataka', 'Solapur, Maharashtra'];
const cropsList = ['Sugarcane (Co 86032)', 'Cotton (Bt hybrid)', 'Maize (HQPM 1)', 'Wheat (HD 2967)'];

const initialInputs = {
  location: 'Nanded, Maharashtra',
  area: 2.5,
  crop: 'Sugarcane (Co 86032)',
  plantingDate: '2026-06-15',
  water: 350,
  irrigation: 'Drip',
  rainfall: 500,
  seed: 10000,
  fertilizer: 18000,
  labor: 12000,
  machinery: 6000,
  other: 8000,
  price: 3100
};

export default function ScenarioBuilder() {
  const [inputs, setInputs] = useState(initialInputs);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdvancedCosts, setShowAdvancedCosts] = useState(false);
  const { saveScenario } = useScenarios();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const cropKey = inputs.crop.split(' ')[0].toLowerCase();
        const payloadInputs = { ...inputs, crop: cropKey };
        const res = await runSimulation(payloadInputs, controller.signal);

        if (isMounted && res) {
          setResult(res);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted && err.name !== 'AbortError') {
          setError('Simulation unavailable. Please check backend connection.');
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [inputs]);

  const change = (key, value) => {
    setInputs((state) => {
      const nextState = { ...state, [key]: value };
      if (key === 'irrigation' && value.toLowerCase() === 'rainfed') {
        nextState.water = 0;
      } else if (key === 'irrigation' && state.irrigation.toLowerCase() === 'rainfed' && value.toLowerCase() !== 'rainfed') {
        nextState.water = 350;
      }
      return nextState;
    });
  };

  const handleSave = async () => {
    const name = window.prompt('Enter scenario title:', `${inputs.crop.split(' ')[0]} Scenario (${inputs.water}mm)`);
    if (!name) return;
    try {
      await saveScenario({ name, inputs, result });
      navigate('/compare');
    } catch (err) {
      setError(`Unable to save scenario: ${err.message}`);
    }
  };

  const isRainfed = inputs.irrigation.toLowerCase() === 'rainfed';

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <span className="text-xs font-extrabold text-emerald-700 tracking-wider uppercase">
            SIMULATION WORKSPACE
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Build &amp; Simulate Farming Scenario
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Explore how changing farming decisions affects modeled outcomes.
          </p>
        </div>

        {/* Engine Status Badge */}
        {result?.engineUsed && (
          <div className="flex items-center gap-3">
            <div
              title="Simulation engine reporting"
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold ${
                result.engineUsed.toLowerCase() === 'aquacrop'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                result.engineUsed.toLowerCase() === 'aquacrop' ? 'bg-emerald-600 animate-pulse' : 'bg-slate-500'
              }`}></span>
              <span>
                {result.engineUsed.toLowerCase() === 'aquacrop'
                  ? 'Simulation model: AquaCrop-OSPy engine'
                  : 'Simulation model: FAO-33 water-stress model'}
              </span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm font-semibold text-rose-800 flex items-center gap-2 shadow-xs">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Left Controls (400px) + Right Results */}
      <div className="flex flex-col xl:flex-row gap-8 xl:gap-10 items-start">
        {/* LEFT COLUMN: INPUT CONTROLS */}
        <div className="w-full xl:w-[400px] shrink-0 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
              INPUT PARAMETERS
            </h2>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
              Interactive
            </span>
          </div>

          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            {/* Group 1: Crop & Farm */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-[20px]">grass</span>
                  <h3 className="text-base font-bold text-slate-900">Crop &amp; Farm Setup</h3>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Crop Selection</label>
                  <div className="relative">
                    <select
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 appearance-none cursor-pointer"
                      value={inputs.crop}
                      onChange={(e) => change('crop', e.target.value)}
                    >
                      {cropsList.map((crop) => (
                        <option key={crop} value={crop}>{crop}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-3 text-slate-400 pointer-events-none text-[18px]">
                      expand_more
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Farm Area (acres)</label>
                  <div className="relative flex items-center">
                    <input
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                      step="0.1"
                      type="number"
                      min="0.1"
                      value={inputs.area}
                      onChange={(e) => change('area', Math.max(0.1, +e.target.value))}
                    />
                    <span className="absolute right-3.5 text-xs text-slate-400 pointer-events-none">acres</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Location</label>
                    <select
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-900 focus:border-emerald-600 appearance-none cursor-pointer"
                      value={inputs.location}
                      onChange={(e) => change('location', e.target.value)}
                    >
                      {locations.map((loc) => (
                        <option key={loc} value={loc}>{loc.split(',')[0]}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Planting Date</label>
                    <input
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-900 focus:border-emerald-600"
                      type="date"
                      value={inputs.plantingDate}
                      onChange={(e) => change('plantingDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Group 2: Water & Hydrology */}
            <div className="pt-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sky-600 text-[20px]">water_drop</span>
                  <h3 className="text-base font-bold text-slate-900">Water &amp; Hydrology</h3>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Irrigation Method</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['Drip', 'Sprinkler', 'Flood', 'Rainfed'].map((method) => {
                      const isSelected = inputs.irrigation.toLowerCase() === method.toLowerCase();
                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => change('irrigation', method)}
                          className={`py-2 px-1.5 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {method}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-700">Planned Irrigation Allocation</span>
                    <span className={`px-2.5 py-0.5 rounded-full border ${
                      isRainfed ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {inputs.water} mm
                    </span>
                  </div>
                  <input
                    disabled={isRainfed}
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                      isRainfed ? 'bg-slate-200 cursor-not-allowed' : 'bg-slate-200 accent-emerald-600'
                    }`}
                    max="1000"
                    min="0"
                    step="10"
                    type="range"
                    value={inputs.water}
                    onChange={(e) => change('water', +e.target.value)}
                  />
                  {isRainfed && (
                    <p className="text-[11px] text-slate-500 italic">Rainfed crops rely strictly on seasonal rainfall (0 mm applied irrigation).</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-700">Seasonal Rainfall</span>
                    <span className="text-sky-700 font-bold">{inputs.rainfall} mm</span>
                  </div>
                  <input
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                    max="1200"
                    min="100"
                    step="10"
                    type="range"
                    value={inputs.rainfall}
                    onChange={(e) => change('rainfall', +e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Group 3: Financial & Market Inputs */}
            <div className="pt-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-600 text-[20px]">payments</span>
                  <h3 className="text-base font-bold text-slate-900">Economics &amp; Market</h3>
                </div>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Market Price (₹/tonne)</span>
                  <input
                    type="number"
                    className="w-32 text-right bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 focus:border-emerald-600"
                    value={inputs.price}
                    onChange={(e) => change('price', +e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Fertilizer Cost (₹)</span>
                  <input
                    type="number"
                    className="w-32 text-right bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 focus:border-emerald-600"
                    value={inputs.fertilizer}
                    onChange={(e) => change('fertilizer', +e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Labor Cost (₹)</span>
                  <input
                    type="number"
                    className="w-32 text-right bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 focus:border-emerald-600"
                    value={inputs.labor}
                    onChange={(e) => change('labor', +e.target.value)}
                  />
                </div>

                {/* Progressive Disclosure: Advanced Costs */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedCosts(!showAdvancedCosts)}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {showAdvancedCosts ? 'expand_less' : 'expand_more'}
                    </span>
                    <span>{showAdvancedCosts ? 'Hide additional input costs' : 'Configure additional input costs'}</span>
                  </button>

                  {showAdvancedCosts && (
                    <div className="mt-3 space-y-2.5 pl-2 border-l-2 border-slate-200 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 font-medium">Seed Cost (₹)</span>
                        <input
                          type="number"
                          className="w-28 text-right bg-white border border-slate-300 rounded-lg px-2 py-1 font-semibold text-slate-900"
                          value={inputs.seed}
                          onChange={(e) => change('seed', +e.target.value)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 font-medium">Machinery Cost (₹)</span>
                        <input
                          type="number"
                          className="w-28 text-right bg-white border border-slate-300 rounded-lg px-2 py-1 font-semibold text-slate-900"
                          value={inputs.machinery}
                          onChange={(e) => change('machinery', +e.target.value)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 font-medium">Other Costs (₹)</span>
                        <input
                          type="number"
                          className="w-28 text-right bg-white border border-slate-300 rounded-lg px-2 py-1 font-semibold text-slate-900"
                          value={inputs.other}
                          onChange={(e) => change('other', +e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: RESULTS & SIMULATION OUTPUTS */}
        <div className="flex-1 min-w-0 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
              MODELED OUTPUTS
            </h2>
            <span className="text-xs text-slate-500 font-medium">Backend Stated Engine Results</span>
          </div>

          {loading && !result ? (
            <div className="flex h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-600 text-[32px] animate-spin">refresh</span>
                <p className="text-slate-800 font-semibold text-base">Running Fast-API simulation model...</p>
              </div>
            </div>
          ) : result ? (
            <>
              {/* Primary Output KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  label="Modeled Yield"
                  value={`${result.yield} t/ha`}
                  detail={`Target: ${result.potentialYield} t/ha`}
                  tone="emerald"
                  icon="eco"
                />
                <KPICard
                  label="Estimated Water Use"
                  value={`${result.water} mm`}
                  detail={`Irrigation: ${inputs.water} mm`}
                  tone="blue"
                  icon="opacity"
                />
                <KPICard
                  label="Estimated Cost"
                  value={`₹${result.cost.toLocaleString('en-IN')}`}
                  detail={`₹${Math.round(result.cost / inputs.area).toLocaleString('en-IN')}/acre`}
                  tone="amber"
                  icon="payments"
                />
                <KPICard
                  label="Modeled Net Profit"
                  value={`₹${result.profit.toLocaleString('en-IN')}`}
                  detail={`ROI: ${result.roi}%`}
                  tone={result.profit >= 0 ? "emerald" : "rose"}
                  icon="account_balance_wallet"
                />
              </div>

              {/* Yield Target & Risk Assessment */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Yield Target Visual */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900">Yield vs Potential Target</h3>
                      <span className="text-xs text-slate-500 font-semibold">Potential: {result.potentialYield} t/ha</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Modeled yield compared against crop potential yield reference under ideal conditions.
                    </p>
                  </div>

                  {/* Dynamic Height Chart */}
                  <div className="mt-6 relative h-48 flex items-end justify-around px-8 pb-4 pt-4 border-b border-slate-100">
                    <div className="flex flex-col items-center gap-2 z-10">
                      <span className="text-xs font-bold text-slate-600">{result.potentialYield} t/ha</span>
                      <div className="w-16 sm:w-20 bg-emerald-100 rounded-t-xl" style={{ height: '120px' }}></div>
                      <span className="text-xs font-semibold text-slate-600 mt-1">Potential Reference</span>
                    </div>

                    <div className="flex flex-col items-center gap-2 z-10">
                      <span className="text-xs font-extrabold text-emerald-700">{result.yield} t/ha</span>
                      <div
                        className="w-16 sm:w-20 bg-emerald-600 rounded-t-xl transition-all duration-300 shadow-sm"
                        style={{ height: `${result.potentialYield > 0 ? Math.min(130, Math.max(15, (result.yield / result.potentialYield) * 120)) : 15}px` }}
                      ></div>
                      <span className="text-xs font-bold text-slate-900 mt-1">Modeled Yield</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span>Engine: <b className="text-slate-700">{result.engineUsed}</b></span>
                    <span className="text-emerald-700 font-semibold">Backend Model Result</span>
                  </div>
                </div>

                {/* Risk Index */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900">Modeled Water &amp; Financial Risk</h3>
                      <span className="material-symbols-outlined text-slate-400 text-[20px]">shield</span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold text-slate-900">
                        {result.risk}
                        <span className="text-base font-normal text-slate-400">/100 Score</span>
                      </span>
                      <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold border ${
                        result.risk < 35
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {result.riskLevel} Risk
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Model-derived composite water-stress and financial risk score.</p>
                  </div>

                  <div className="space-y-2 mt-4">
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Risk Drivers:</p>
                    {result.riskFactors && result.riskFactors.length > 0 ? (
                      result.riskFactors.map((factor, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span>{factor}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 font-medium">Low water stress and healthy profit margins under current inputs.</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between mt-4">
                    <span>Low Risk &lt; 35</span>
                    <span className="text-emerald-700 font-semibold">Model Derived</span>
                  </div>
                </div>
              </div>

              {/* Cost Allocation & Reasoning Card */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900">Cost Breakdown</h3>
                      <span className="text-xs font-bold text-slate-700">Total: ₹{result.cost.toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Estimated expenditure breakdown from backend model</p>
                  </div>

                  <div className="my-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                        <span className="text-slate-600 font-medium">Labor Cost</span>
                      </div>
                      <span className="font-bold text-slate-900">₹{Math.round(result.laborCost).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
                        <span className="text-slate-600 font-medium">Irrigation Operating Cost</span>
                      </div>
                      <span className="font-bold text-slate-900">₹{Math.round(result.irrigationCost).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span className="text-slate-600 font-medium">Inputs (Seed, Fertilizer, Machinery, Other)</span>
                      </div>
                      <span className="font-bold text-slate-900">₹{Math.round(result.inputCost).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Reasoning & Actions Card */}
                <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3 border border-emerald-200">
                      <span className="material-symbols-outlined text-[15px]">psychology</span>
                      <span>Simulation Reasoning</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900">Scenario Reasoning &amp; Impact</h4>
                    <p className="text-xs text-slate-700 mt-2 leading-relaxed font-medium">
                      {result.explanation ? (
                        result.explanation
                      ) : (
                        <span className="text-slate-600">
                          Modeled via FAO-33 water-stress equations. Save this scenario and compare it with an alternative scenario to view detailed factor sensitivity and narrative comparisons.
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={handleSave}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
                    >
                      Save Scenario &amp; Compare
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
