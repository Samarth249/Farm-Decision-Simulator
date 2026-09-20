import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useScenarios } from '../context/ScenarioContext';
import { runSimulation } from '../services/api';
import KPICard from '../components/KPICard';

const locations = ['Nanded, Maharashtra', 'Nashik, Maharashtra', 'Kolhapur, Maharashtra', 'Belagavi, Karnataka', 'Solapur, Maharashtra'];
const cropsList = ['Sugarcane (Co 86032)', 'Cotton (Bt hybrid)', 'Soybean (JS 335)', 'Wheat (HD 2967)'];

const initialInputs = {
  location: 'Nanded, Maharashtra',
  area: 2.5,
  crop: 'Sugarcane (Co 86032)',
  plantingDate: '2026-06-15',
  water: 750,
  irrigation: 'Drip',
  rainfall: 380,
  fertilizer: 21700,
  labor: 41230,
  other: 19530,
  price: 3100
};

export default function ScenarioBuilder() {
  const [inputs, setInputs] = useState(initialInputs);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const { saveScenario } = useScenarios();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const timer = setTimeout(async () => {
      const cropKey = inputs.crop.split(' ')[0].toLowerCase();
      const payloadInputs = { ...inputs, crop: cropKey };
      const res = await runSimulation(payloadInputs);

      if (isMounted) {
        setResult(res);
        setLoading(false);
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [inputs]);

  const change = (key, value) => setInputs((state) => ({ ...state, [key]: value }));

  const handleSave = () => {
    const name = window.prompt('Enter scenario name:', `${inputs.crop.split(' ')[0]} Plan - ${inputs.water}mm`);
    if (!name) return;
    saveScenario({ name, inputs, result });
    navigate('/compare');
  };

  return (
    <div className="space-y-8">
      {/* Page Title Banner & Engine Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <span className="text-xs font-extrabold text-emerald-700 tracking-wider uppercase">
            DECISION WORKSPACE
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Build &amp; Simulate Farming Scenario
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Adjust operational variables to evaluate real-time agronomic, hydrologic, and economic outcomes.
          </p>
        </div>

        {/* Subtle Simulation Engine Status Badge */}
        {result?.engineUsed && (
          <div className="flex items-center gap-3">
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold ${
              result.engineUsed.toLowerCase() === 'aquacrop'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                result.engineUsed.toLowerCase() === 'aquacrop' ? 'bg-emerald-600 animate-pulse' : 'bg-slate-500'
              }`}></span>
              <span>Simulation Engine: {result.engineUsed.toLowerCase() === 'aquacrop' ? 'AquaCrop-OSPy' : 'Fallback (FAO-33)'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Spacious Layout Grid: Left Inputs (420px) + Right Results */}
      <div className="flex flex-col xl:flex-row gap-8 xl:gap-10 items-start">
        {/* LEFT COLUMN: PARAMETER INPUT CONTROLS */}
        <div className="w-full xl:w-[420px] shrink-0 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
              INPUT PARAMETERS
            </h2>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
              Interactive
            </span>
          </div>

          <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-7 shadow-sm space-y-6">
            {/* Section 1: Farm & Crop */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-[20px]">grass</span>
                  <h3 className="text-base font-bold text-slate-900">Farm &amp; Crop Specs</h3>
                </div>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Core</span>
              </div>

              <div className="mt-4 space-y-4">
                {/* Location Select */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Location</label>
                  <div className="relative">
                    <select
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 appearance-none cursor-pointer"
                      value={inputs.location}
                      onChange={(e) => change('location', e.target.value)}
                    >
                      {locations.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-3 text-slate-400 pointer-events-none text-[18px]">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Farm Area */}
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

                {/* Crop Selector */}
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

                {/* Planting Date */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Planting Date</label>
                  <input
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                    type="date"
                    value={inputs.plantingDate}
                    onChange={(e) => change('plantingDate', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Water & Weather */}
            <div className="pt-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sky-600 text-[20px]">water_drop</span>
                  <h3 className="text-base font-bold text-slate-900">Water &amp; Hydrology</h3>
                </div>
                <span className="text-xs font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded">Irrigation</span>
              </div>

              <div className="mt-4 space-y-5">
                {/* Water Availability Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-700">Irrigation Allocation</span>
                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      {inputs.water} mm
                    </span>
                  </div>
                  <input
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    max="1200"
                    min="300"
                    step="10"
                    type="range"
                    value={inputs.water}
                    onChange={(e) => change('water', +e.target.value)}
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>300 mm (Deficit)</span>
                    <span>1200 mm (Abundant)</span>
                  </div>
                </div>

                {/* Irrigation Method Selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Irrigation Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Drip', 'Sprinkler', 'Flood'].map((method) => {
                      const isSelected = inputs.irrigation === method;
                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => change('irrigation', method)}
                          className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
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

                {/* Seasonal Rainfall */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-700">Seasonal Rainfall</span>
                    <span className="text-sky-700 font-bold">{inputs.rainfall} mm</span>
                  </div>
                  <input
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    max="1000"
                    min="100"
                    step="10"
                    type="range"
                    value={inputs.rainfall}
                    onChange={(e) => change('rainfall', +e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Financial Inputs */}
            <div className="pt-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-600 text-[20px]">payments</span>
                  <h3 className="text-base font-bold text-slate-900">Financial Inputs</h3>
                </div>
                <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Costs</span>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Fertilizer Expenditure (₹)</span>
                  <input
                    type="number"
                    className="w-32 text-right bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900"
                    value={inputs.fertilizer}
                    onChange={(e) => change('fertilizer', +e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Labor Expenditure (₹)</span>
                  <input
                    type="number"
                    className="w-32 text-right bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900"
                    value={inputs.labor}
                    onChange={(e) => change('labor', +e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Expected Market Price (₹/t)</span>
                  <input
                    type="number"
                    className="w-32 text-right bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900"
                    value={inputs.price}
                    onChange={(e) => change('price', +e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: RESULTS & SIMULATION CANVAS */}
        <div className="flex-1 min-w-0 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
              RESULTS &amp; SIMULATION CANVAS
            </h2>
            <span className="text-xs text-slate-500">Live Fast-API Computed Outputs</span>
          </div>

          {loading && !result ? (
            <div className="flex h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-600 text-[32px] animate-spin">refresh</span>
                <p className="text-slate-800 font-semibold text-base">Running Fast-API simulation pipeline...</p>
              </div>
            </div>
          ) : (
            <>
              {/* 1. Top KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <KPICard
                  label="Estimated Yield"
                  value={`${result.yield} t/ha`}
                  detail="+3.8% vs baseline"
                  tone="emerald"
                  icon="eco"
                />
                <KPICard
                  label="Water Consumed"
                  value={`${result.water} mm`}
                  detail={`${inputs.irrigation} Efficient`}
                  tone="blue"
                  icon="opacity"
                />
                <KPICard
                  label="Total Production Cost"
                  value={`₹${result.cost.toLocaleString('en-IN')}`}
                  detail={`₹${Math.round(result.cost / inputs.area).toLocaleString('en-IN')}/ac`}
                  tone="amber"
                  icon="payments"
                />
                <KPICard
                  label="Expected Net Profit"
                  value={`₹${result.profit.toLocaleString('en-IN')}`}
                  detail={`${result.riskLevel} Risk`}
                  tone={result.profit >= 0 ? "emerald" : "rose"}
                  icon="account_balance_wallet"
                />
              </div>

              {/* 2. Middle Grid: Yield Comparison Chart & Risk Assessment */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Yield Comparison Widget */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-7 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-slate-900">Yield Comparison</h3>
                      <span className="text-xs text-slate-400 font-medium">Potential: 90 t/ha</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Projected harvest yield against potential baseline target.
                    </p>
                  </div>

                  <div className="mt-6 relative h-56 flex items-end justify-around px-6 pb-6 pt-4 border-b border-slate-100">
                    <div className="absolute inset-x-0 top-4 border-b border-slate-100 flex justify-between text-[11px] text-slate-400">
                      <span>90 t/ha</span>
                    </div>
                    <div className="absolute inset-x-0 top-1/2 border-b border-slate-100 flex justify-between text-[11px] text-slate-400">
                      <span>45 t/ha</span>
                    </div>

                    {/* Bar 1: Baseline */}
                    <div className="flex flex-col items-center gap-2 z-10">
                      <span className="text-xs font-bold text-slate-700">90.0 t/ha</span>
                      <div className="w-16 sm:w-20 bg-emerald-100 rounded-t-xl transition-all duration-300" style={{ height: '140px' }}></div>
                      <span className="text-xs font-semibold text-slate-600 mt-1">Baseline Yield</span>
                    </div>

                    {/* Bar 2: Simulated */}
                    <div className="flex flex-col items-center gap-2 z-10">
                      <span className="text-xs font-extrabold text-emerald-700">{result.yield} t/ha</span>
                      <div
                        className="w-16 sm:w-20 bg-emerald-600 rounded-t-xl transition-all duration-300 shadow-md shadow-emerald-600/20"
                        style={{ height: `${Math.min(150, Math.max(20, (result.yield / 90) * 140))}px` }}
                      ></div>
                      <span className="text-xs font-bold text-slate-900 mt-1">Simulated Yield</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span>Engine: <b className="text-slate-800">{result.engineUsed}</b></span>
                    <span className="text-emerald-700 font-bold hover:underline cursor-pointer">View Agronomic Metrics</span>
                  </div>
                </div>

                {/* Detailed Risk Assessment Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-7 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-slate-900">Composite Risk Assessment</h3>
                      <span className="material-symbols-outlined text-slate-400 text-[20px]">shield</span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold text-slate-900">
                        {result.risk}
                        <span className="text-base font-normal text-slate-400">/100 Index</span>
                      </span>
                      <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold border ${
                        result.risk < 35
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {result.riskLevel} Risk
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Model-derived risk evaluation combining hydrology and finance.</p>
                  </div>

                  {/* Telemetry Bars */}
                  <div className="space-y-3.5 my-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600">Water Stress Deficit</span>
                        <span className="text-slate-900 font-bold">{Math.min(100, Math.round(result.risk * 0.9))}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${Math.min(100, Math.round(result.risk * 0.9))}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600">Weather Risk</span>
                        <span className="text-slate-900 font-bold">{Math.max(10, Math.round(result.risk * 0.7))}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${Math.max(10, Math.round(result.risk * 0.7))}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600">Cost Exposure Risk</span>
                        <span className="text-slate-900 font-bold">32%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full" style={{ width: '32%' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                    <span>Safe Threshold &lt; 35%</span>
                    <span className="text-emerald-700 font-bold">Optimal Conditions</span>
                  </div>
                </div>
              </div>

              {/* 3. Cost Breakdown Donut & AI Reasoning Card */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Donut Chart (7 Cols) */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 md:p-7 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-slate-900">Cost Breakdown</h3>
                      <span className="text-xs font-semibold text-slate-500">Total: ₹{result.cost.toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Expenditure allocation per operational sector</p>
                  </div>

                  <div className="my-4 flex flex-col sm:flex-row items-center gap-6 justify-around">
                    <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4.5" />
                        <path className="text-emerald-600" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="38, 100" strokeWidth="4.5" />
                        <path className="text-sky-600" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="24, 100" strokeDashoffset="-38" strokeWidth="4.5" />
                        <path className="text-amber-500" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="20, 100" strokeDashoffset="-62" strokeWidth="4.5" />
                        <path className="text-slate-400" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="18, 100" strokeDashoffset="-82" strokeWidth="4.5" />
                      </svg>
                      <div className="absolute flex flex-col items-center text-center">
                        <span className="text-base font-extrabold text-slate-900">{inputs.area} ac</span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Area</span>
                      </div>
                    </div>

                    <div className="space-y-2 flex-1 w-full max-w-[240px]">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                          <span className="text-slate-600 font-medium">Seeds &amp; Labor</span>
                        </div>
                        <span className="font-bold text-slate-900">₹{inputs.labor.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
                          <span className="text-slate-600 font-medium">Irrigation Operating</span>
                        </div>
                        <span className="font-bold text-slate-900">₹{Math.round(inputs.water * 20 * inputs.area * 0.404).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                          <span className="text-slate-600 font-medium">Fertilizers</span>
                        </div>
                        <span className="font-bold text-slate-900">₹{inputs.fertilizer.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                          <span className="text-slate-600 font-medium">Other Inputs</span>
                        </div>
                        <span className="font-bold text-slate-900">₹{inputs.other.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Subsidies applied: PMKSY Drip Scheme (₹18,000 credit)</span>
                    <span className="text-emerald-700 font-bold hover:underline cursor-pointer">Download Report</span>
                  </div>
                </div>

                {/* Strategic AI Scenario Reasoning Card (5 Cols) */}
                <div className="lg:col-span-5 bg-gradient-to-br from-emerald-50/50 to-slate-50 border border-emerald-200/80 rounded-2xl p-6 md:p-7 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3 border border-emerald-200">
                      <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
                      <span>Simulation Reasoning Engine</span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-900">Why did this outcome happen?</h4>
                    <p className="text-sm text-slate-700 mt-2 leading-relaxed font-medium">
                      {result.explanation}
                    </p>
                  </div>

                  <div className="mt-6 space-y-3">
                    <button
                      onClick={handleSave}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
                    >
                      Save &amp; Compare Scenario
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
