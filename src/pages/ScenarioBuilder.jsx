import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScenarios } from '../context/ScenarioContext';
import { runSimulation } from '../services/api';

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
      // Map friendly display crop to internal crop key
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
    <div className="space-y-6">
      {/* Breadcrumb & Workspace Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-label-eyebrow font-bold text-primary tracking-wider uppercase">
            DECISION WORKSPACE
          </span>
          <h2 className="text-headline-lg font-bold text-on-surface tracking-tight mt-0.5">
            Build a farming scenario
          </h2>
          <p className="text-body-sm text-outline mt-1 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-primary-fixed-dim"></span>
            Simulating yield variations, hydrology metrics, and localized cashflow impact
            {result?.engineUsed && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container-low text-secondary border border-outline-variant/40">
                ENGINE: {result.engineUsed.toUpperCase()}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/40 px-3.5 py-2 rounded-lg text-body-sm shadow-sm">
          <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
          <span className="font-medium text-on-surface">{inputs.location}</span>
          <span className="text-outline-variant">|</span>
          <span className="text-outline">Zone 7 Sub-tropical</span>
        </div>
      </div>

      {/* Main Layout Grid: Left Controls (4 Cols) + Right Analytics (8 Cols) */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Parameter Input Control Panel (4 Columns) */}
        <section className="col-span-12 xl:col-span-4 bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-6 shadow-sm space-y-6">
          {/* Section 1: Farm & Crop */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">grass</span>
                <h3 className="text-headline-sm text-on-surface">Farm &amp; crop</h3>
              </div>
              <span className="text-label-xs bg-surface-container-low text-secondary px-2 py-0.5 rounded font-medium">
                Core Specs
              </span>
            </div>

            <div className="mt-4 space-y-4">
              {/* Location Select */}
              <div className="space-y-1.5">
                <label className="block text-label-md text-on-surface-variant font-medium">Location</label>
                <div className="relative">
                  <select
                    className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-lg px-3.5 py-2.5 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                    value={inputs.location}
                    onChange={(e) => change('location', e.target.value)}
                  >
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3 text-outline pointer-events-none text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Farm Area */}
              <div className="space-y-1.5">
                <label className="block text-label-md text-on-surface-variant font-medium">Farm area (acres)</label>
                <div className="relative flex items-center">
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-lg px-3.5 py-2.5 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                    step="0.1"
                    type="number"
                    min="0.1"
                    value={inputs.area}
                    onChange={(e) => change('area', Math.max(0.1, +e.target.value))}
                  />
                  <span className="absolute right-3.5 text-body-sm text-outline pointer-events-none">acres</span>
                </div>
              </div>

              {/* Crop Selector */}
              <div className="space-y-1.5">
                <label className="block text-label-md text-on-surface-variant font-medium">Crop</label>
                <div className="relative">
                  <select
                    className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-lg px-3.5 py-2.5 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                    value={inputs.crop}
                    onChange={(e) => change('crop', e.target.value)}
                  >
                    {cropsList.map((crop) => (
                      <option key={crop} value={crop}>{crop}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3 text-outline pointer-events-none text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Planting Date */}
              <div className="space-y-1.5">
                <label className="block text-label-md text-on-surface-variant font-medium">Planting date</label>
                <div className="relative flex items-center">
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-lg px-3.5 py-2.5 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                    type="date"
                    value={inputs.plantingDate}
                    onChange={(e) => change('plantingDate', e.target.value)}
                  />
                  <span className="material-symbols-outlined absolute right-3.5 text-outline pointer-events-none text-[18px]">
                    calendar_today
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Water & Weather */}
          <div className="pt-2">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">water_drop</span>
                <h3 className="text-headline-sm text-on-surface">Water &amp; weather</h3>
              </div>
              <span className="text-label-xs bg-secondary-container/50 text-on-secondary-container px-2 py-0.5 rounded font-medium">
                Hydrology
              </span>
            </div>

            <div className="mt-4 space-y-5">
              {/* Water Availability Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-label-md">
                  <span className="text-on-surface-variant">Water availability</span>
                  <span className="text-primary font-bold bg-secondary-container/40 px-2 py-0.5 rounded text-label-sm">
                    {inputs.water} mm
                  </span>
                </div>
                <input
                  className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                  max="1200"
                  min="300"
                  step="10"
                  type="range"
                  value={inputs.water}
                  onChange={(e) => change('water', +e.target.value)}
                />
                <div className="flex justify-between text-label-xs text-outline">
                  <span>300 mm (Deficit)</span>
                  <span>1200 mm (Abundant)</span>
                </div>
              </div>

              {/* Irrigation Method */}
              <div className="space-y-1.5">
                <label className="block text-label-md text-on-surface-variant font-medium">Irrigation</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Drip', 'Sprinkler', 'Flood'].map((method) => {
                    const isSelected = inputs.irrigation === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => change('irrigation', method)}
                        className={`py-2 px-3 border rounded-lg text-label-md font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-primary bg-secondary-container/30 text-primary font-bold'
                            : 'border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low'
                        }`}
                      >
                        {isSelected && <span className="material-symbols-outlined text-[16px]">check_circle</span>}
                        {method}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Expected Rainfall */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-label-md">
                  <span className="text-on-surface-variant font-medium">Expected rainfall</span>
                  <span className="text-primary font-bold">{inputs.rainfall} mm</span>
                </div>
                <input
                  className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                  max="1000"
                  min="100"
                  step="10"
                  type="range"
                  value={inputs.rainfall}
                  onChange={(e) => change('rainfall', +e.target.value)}
                />
                <p className="text-body-sm text-outline">Projected based on Indian Meteorological monsoon anomaly.</p>
              </div>
            </div>
          </div>

          {/* Section 3: Financial & Nutrient Controls */}
          <div className="pt-2">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">science</span>
                <h3 className="text-headline-sm text-on-surface">Economics &amp; Nutrients</h3>
              </div>
              <span className="text-label-xs text-outline font-medium">NPK 120:60:40</span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-low">
                  <div className="text-label-xs text-outline">Nitrogen</div>
                  <div className="text-headline-sm text-on-surface font-bold mt-0.5">120 kg</div>
                  <span className="text-[10px] text-primary font-semibold">Optimal</span>
                </div>
                <div className="p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-low">
                  <div className="text-label-xs text-outline">Phosphorus</div>
                  <div className="text-headline-sm text-on-surface font-bold mt-0.5">60 kg</div>
                  <span className="text-[10px] text-primary font-semibold">Standard</span>
                </div>
                <div className="p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-low">
                  <div className="text-label-xs text-outline">Potassium</div>
                  <div className="text-headline-sm text-on-surface font-bold mt-0.5">40 kg</div>
                  <span className="text-[10px] text-secondary font-semibold">Recommended</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-body-sm">
                  <span className="text-on-surface-variant">Fertilizer Cost (₹)</span>
                  <input
                    type="number"
                    className="w-28 text-right bg-surface-container-lowest border border-outline-variant/60 rounded px-2 py-1 text-xs font-semibold"
                    value={inputs.fertilizer}
                    onChange={(e) => change('fertilizer', +e.target.value)}
                  />
                </div>
                <div className="flex justify-between text-body-sm">
                  <span className="text-on-surface-variant">Labor Cost (₹)</span>
                  <input
                    type="number"
                    className="w-28 text-right bg-surface-container-lowest border border-outline-variant/60 rounded px-2 py-1 text-xs font-semibold"
                    value={inputs.labor}
                    onChange={(e) => change('labor', +e.target.value)}
                  />
                </div>
                <div className="flex justify-between text-body-sm">
                  <span className="text-on-surface-variant">Market Price (₹/t)</span>
                  <input
                    type="number"
                    className="w-28 text-right bg-surface-container-lowest border border-outline-variant/60 rounded px-2 py-1 text-xs font-semibold"
                    value={inputs.price}
                    onChange={(e) => change('price', +e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Real-Time Simulation Canvas & Decision Telemetry (8 Columns) */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          {loading && !result ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[28px] animate-spin">refresh</span>
                <p className="text-on-surface font-medium">Running scientific simulation backend...</p>
              </div>
            </div>
          ) : (
            <>
              {/* 1. Top Key Metric KPI Cards (4 Grid Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1: Estimated Yield */}
                <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-label-md text-on-surface-variant font-medium">Estimated yield</span>
                    <span className="material-symbols-outlined text-primary text-[18px]">eco</span>
                  </div>
                  <div className="text-title-kpi text-on-surface mt-2 font-bold">
                    {result.yield} <span className="text-body-md font-normal text-outline">t/ha</span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <span className="inline-flex items-center text-label-xs font-semibold px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">
                      <span className="material-symbols-outlined text-[13px] mr-0.5">trending_up</span> +3.8%
                    </span>
                    <span className="text-body-sm text-outline">vs baseline</span>
                  </div>
                </div>

                {/* KPI 2: Water Consumption */}
                <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-label-md text-on-surface-variant font-medium">Water consumption</span>
                    <span className="material-symbols-outlined text-secondary text-[18px]">opacity</span>
                  </div>
                  <div className="text-title-kpi text-on-surface mt-2 font-bold">
                    {result.water} <span className="text-body-md font-normal text-outline">mm</span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <span className="inline-flex items-center text-label-xs font-semibold px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                      Conserved
                    </span>
                    <span className="text-body-sm text-outline">by {inputs.irrigation}</span>
                  </div>
                </div>

                {/* KPI 3: Total Cost */}
                <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-label-md text-on-surface-variant font-medium">Total cost</span>
                    <span className="material-symbols-outlined text-outline text-[18px]">payments</span>
                  </div>
                  <div className="text-title-kpi text-on-surface mt-2 font-bold">
                    ₹{result.cost.toLocaleString('en-IN')}
                  </div>
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <span className="text-body-sm text-outline">
                      ₹{Math.round(result.cost / inputs.area).toLocaleString('en-IN')} / acre
                    </span>
                  </div>
                </div>

                {/* KPI 4: Expected Profit */}
                <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-label-md text-on-surface-variant font-medium">Expected profit</span>
                    <span className="material-symbols-outlined text-primary text-[18px]">account_balance_wallet</span>
                  </div>
                  <div className="text-title-kpi text-on-surface mt-2 text-primary font-bold">
                    ₹{result.profit.toLocaleString('en-IN')}
                  </div>
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <span className="inline-flex items-center text-label-xs font-semibold px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">
                      {result.riskLevel} Risk
                    </span>
                    <span className="text-body-sm text-outline">
                      ROI {Math.round((result.profit / result.cost) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Middle Section Split: Yield Comparison Chart + Detailed Risk Assessment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Yield Comparison Bar Widget */}
                <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-headline-sm text-on-surface font-semibold">Yield comparison</h3>
                      <span className="text-label-xs text-outline">Index: 100 Baseline</span>
                    </div>
                    <p className="text-body-sm text-outline mt-1">
                      Projected performance against baseline yield index.
                    </p>
                  </div>

                  {/* Bar Visualization Canvas */}
                  <div className="mt-8 relative h-56 flex items-end justify-around px-8 pb-8 pt-4 border-b border-outline-variant/30">
                    <div className="absolute inset-x-0 top-4 border-b border-outline-variant/20 flex justify-between text-[11px] text-outline">
                      <span>100</span>
                    </div>
                    <div className="absolute inset-x-0 top-1/2 border-b border-outline-variant/20 flex justify-between text-[11px] text-outline">
                      <span>50</span>
                    </div>
                    <div className="absolute inset-x-0 bottom-8 border-b border-outline-variant/30 flex justify-between text-[11px] text-outline">
                      <span>0</span>
                    </div>

                    {/* Bar 1: Baseline */}
                    <div className="flex flex-col items-center gap-2 z-10">
                      <span className="text-label-xs font-semibold text-on-surface">90 t/ha</span>
                      <div className="w-16 sm:w-20 bg-primary-container rounded-t-lg transition-all duration-300 shadow-sm" style={{ height: '140px' }}></div>
                      <span className="text-body-sm font-medium text-on-surface-variant mt-1">Baseline Yield</span>
                    </div>

                    {/* Bar 2: Simulated */}
                    <div className="flex flex-col items-center gap-2 z-10">
                      <span className="text-label-xs font-semibold text-primary">{result.yield} t/ha</span>
                      <div
                        className="w-16 sm:w-20 bg-primary rounded-t-lg transition-all duration-300 shadow-sm"
                        style={{ height: `${Math.min(150, Math.max(20, (result.yield / 90) * 140))}px` }}
                      ></div>
                      <span className="text-body-sm font-medium text-on-surface-variant mt-1">Simulated Yield</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 flex items-center justify-between text-body-sm">
                    <span className="text-outline">Engine: {result.engineUsed}</span>
                    <span className="text-primary font-medium hover:underline cursor-pointer">
                      View agronomic details
                    </span>
                  </div>
                </div>

                {/* Detailed Risk Assessment Card */}
                <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-headline-sm text-on-surface font-semibold">Detailed risk assessment</h3>
                      <span className="material-symbols-outlined text-outline text-[18px]">shield</span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-display text-on-surface font-bold">
                        {result.risk}
                        <span className="text-headline-md font-normal text-outline">/100</span>
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-label-xs font-semibold ${
                        result.risk < 35 ? 'bg-secondary-container text-on-secondary-container' : 'bg-tertiary-container/30 text-tertiary'
                      }`}>
                        {result.riskLevel}
                      </span>
                    </div>
                    <p className="text-body-sm text-outline mt-0.5">Composite stress evaluation based on model calculations.</p>
                  </div>

                  {/* Risk Telemetry Bars */}
                  <div className="space-y-3.5 my-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-label-md">
                        <span className="text-on-surface-variant">Water Stress</span>
                        <span className="text-on-surface font-semibold">{Math.min(100, Math.round(result.risk * 0.9))}%</span>
                      </div>
                      <div className="w-full bg-surface-container-high rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(100, Math.round(result.risk * 0.9))}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-label-md">
                        <span className="text-on-surface-variant">Weather Deficit Risk</span>
                        <span className="text-on-surface font-semibold">{Math.max(10, Math.round(result.risk * 0.7))}%</span>
                      </div>
                      <div className="w-full bg-surface-container-high rounded-full h-2">
                        <div className="bg-tertiary-container h-2 rounded-full" style={{ width: `${Math.max(10, Math.round(result.risk * 0.7))}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-label-md">
                        <span className="text-on-surface-variant">Cost Exposure Risk</span>
                        <span className="text-on-surface font-semibold">32%</span>
                      </div>
                      <div className="w-full bg-surface-container-high rounded-full h-2">
                        <div className="bg-tertiary-container h-2 rounded-full" style={{ width: '32%' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-outline-variant/30 text-body-sm text-on-surface-variant flex items-center justify-between">
                    <span>Safe threshold &lt; 35%</span>
                    <span className="text-primary font-medium">Optimal Conditions</span>
                  </div>
                </div>
              </div>

              {/* 3. Bottom Section: Cost Breakdown & Strategic Action Banner */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Cost Breakdown Donut Visualization Card (7 Cols) */}
                <div className="md:col-span-7 bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-headline-sm text-on-surface font-semibold">Cost breakdown</h3>
                      <span className="text-body-sm text-outline">Total: ₹{result.cost.toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-body-sm text-outline mt-0.5">Expenditure allocation per operational sector</p>
                  </div>

                  <div className="my-4 flex flex-col sm:flex-row items-center gap-6 justify-around">
                    {/* SVG Donut Representation */}
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path className="text-surface-container-high" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4.5" />
                        <path className="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="38, 100" strokeWidth="4.5" />
                        <path className="text-primary-container" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="24, 100" strokeDashoffset="-38" strokeWidth="4.5" />
                        <path className="text-secondary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="20, 100" strokeDashoffset="-62" strokeWidth="4.5" />
                        <path className="text-tertiary-fixed-dim" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="18, 100" strokeDashoffset="-82" strokeWidth="4.5" />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-headline-sm font-semibold text-on-surface">{inputs.area} ac</span>
                        <span className="text-[10px] text-outline uppercase font-medium">Cultivated</span>
                      </div>
                    </div>

                    {/* Legend List */}
                    <div className="space-y-2 flex-1 w-full max-w-[220px]">
                      <div className="flex items-center justify-between text-body-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                          <span className="text-on-surface-variant">Seeds &amp; Labor</span>
                        </div>
                        <span className="font-medium text-on-surface">₹{inputs.labor.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between text-body-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
                          <span className="text-on-surface-variant">Irrigation Operating</span>
                        </div>
                        <span className="font-medium text-on-surface">₹{Math.round(inputs.water * 20 * inputs.area * 0.404).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between text-body-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                          <span className="text-on-surface-variant">Fertilizers</span>
                        </div>
                        <span className="font-medium text-on-surface">₹{inputs.fertilizer.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between text-body-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-tertiary-fixed-dim"></span>
                          <span className="text-on-surface-variant">Protection &amp; Other</span>
                        </div>
                        <span className="font-medium text-on-surface">₹{inputs.other.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-between text-label-xs text-outline">
                    <span>Subsidies applied: PMKSY Drip Scheme (₹18,000 credit)</span>
                    <span className="text-primary font-semibold cursor-pointer hover:underline">Download report</span>
                  </div>
                </div>

                {/* Strategic Action & Comparison Banner (5 Cols) */}
                <div className="md:col-span-5 bg-gradient-to-br from-secondary-container/30 to-surface-container-low border border-outline-variant/40 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-label-xs mb-3 font-semibold">
                      <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
                      <span>AI Scenario Reasoning Engine</span>
                    </div>
                    <h4 className="text-headline-md font-semibold text-on-surface">Why did this outcome happen?</h4>
                    <p className="text-body-sm text-on-surface-variant mt-2 leading-relaxed">
                      {result.explanation}
                    </p>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/30">
                      <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                      <div className="text-body-sm">
                        <span className="font-semibold text-on-surface">High Feasibility Score</span>
                        <p className="text-outline text-xs">Soil moisture aligns with Kharif growth phase.</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        className="flex-1 py-2.5 px-3 rounded-lg bg-primary text-on-primary text-label-md font-semibold hover:bg-primary-container transition-colors text-center shadow-sm cursor-pointer"
                      >
                        Save &amp; Compare Scenario
                      </button>
                    </div>
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
