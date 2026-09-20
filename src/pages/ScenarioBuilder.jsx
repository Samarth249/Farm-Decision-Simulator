import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useScenarios } from '../context/ScenarioContext';
import { runSimulation } from '../services/api';
import ChartWidget from '../components/ChartWidget';
import KPICard from '../components/KPICard';

const locations = ['Nanded, Maharashtra', 'Pune, Maharashtra', 'Solapur, Maharashtra', 'Latur, Maharashtra', 'Nashik, Maharashtra'];
const cropsList = ['Sugarcane', 'Wheat', 'Maize', 'Cotton'];

const initialInputs = {
  location: 'Nanded, Maharashtra',
  area: 2.5,
  crop: 'Sugarcane',
  plantingDate: '2026-06-15',
  water: 350,
  irrigation: 'Drip',
  rainfall: 500,
  temperature: 30,
  fertilizer: 18000,
  labor: 12000,
  other: 8000,
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
      const res = await runSimulation(inputs);
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
    const name = window.prompt('Enter scenario name:', `${inputs.crop} Plan - ${inputs.water}mm`);
    if (!name) return;
    saveScenario({ name, inputs, result });
    navigate('/compare');
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-emerald-700">DECISION WORKSPACE</p>
            {result?.engineUsed && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 border border-slate-200">
                Engine: {result.engineUsed.toUpperCase()}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold">Build &amp; Simulate Farming Scenario</h1>
        </div>
        <button
          onClick={handleSave}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700 shadow-sm transition"
        >
          Save Scenario
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[22rem_1fr]">
        {/* Scenario Input Controls */}
        <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Farm &amp; Crop Parameters</h2>
          
          <Field label="Location">
            <select value={inputs.location} onChange={(e) => change('location', e.target.value)}>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </Field>

          <Field label="Farm Area (acres)">
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={inputs.area}
              onChange={(e) => change('area', Math.max(0.1, +e.target.value))}
            />
          </Field>

          <Field label="Crop Selection">
            <select value={inputs.crop} onChange={(e) => change('crop', e.target.value)}>
              {cropsList.map((crop) => (
                <option key={crop} value={crop}>{crop}</option>
              ))}
            </select>
          </Field>

          <Field label="Planting Date">
            <input
              type="date"
              value={inputs.plantingDate}
              onChange={(e) => change('plantingDate', e.target.value)}
            />
          </Field>

          <h2 className="border-t pt-5 font-semibold text-slate-900">Water &amp; Irrigation</h2>

          <Range
            label="Irrigation Allocation (mm)"
            value={inputs.water}
            min={50}
            max={1000}
            step={10}
            onChange={(val) => change('water', val)}
          />

          <Field label="Irrigation Method">
            <select value={inputs.irrigation} onChange={(e) => change('irrigation', e.target.value)}>
              <option value="Drip">Drip Irrigation (90% eff)</option>
              <option value="Sprinkler">Sprinkler Irrigation (75% eff)</option>
              <option value="Flood">Flood Irrigation (60% eff)</option>
              <option value="Rainfed">Rainfed (No Irrigation)</option>
            </select>
          </Field>

          <Range
            label="Seasonal Rainfall (mm)"
            value={inputs.rainfall}
            min={100}
            max={1500}
            step={10}
            onChange={(val) => change('rainfall', val)}
          />

          <h2 className="border-t pt-5 font-semibold text-slate-900">Financial Inputs</h2>

          <Field label="Fertilizer Cost (₹)">
            <input
              type="number"
              value={inputs.fertilizer}
              onChange={(e) => change('fertilizer', +e.target.value)}
            />
          </Field>

          <Field label="Labor Cost (₹)">
            <input
              type="number"
              value={inputs.labor}
              onChange={(e) => change('labor', +e.target.value)}
            />
          </Field>

          <Field label="Other Inputs Cost (₹)">
            <input
              type="number"
              value={inputs.other}
              onChange={(e) => change('other', +e.target.value)}
            />
          </Field>

          <Field label="Expected Market Price (₹/tonne)">
            <input
              type="number"
              value={inputs.price}
              onChange={(e) => change('price', +e.target.value)}
            />
          </Field>
        </section>

        {/* Live Simulation Output Dashboard */}
        <section className="space-y-6">
          {loading && !result ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-slate-500 font-medium">Running scientific simulation backend...</p>
            </div>
          ) : (
            <>
              {/* Key Metric Indicators */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KPICard label="Estimated Yield" value={`${result.yield} t/ha`} />
                <KPICard label="Water Consumption" value={`${result.water} mm`} tone="blue" />
                <KPICard label="Total Production Cost" value={`₹${result.cost.toLocaleString('en-IN')}`} tone="amber" />
                <KPICard
                  label="Expected Net Profit"
                  value={`₹${result.profit.toLocaleString('en-IN')}`}
                  detail={`Risk: ${result.riskLevel}`}
                  tone={result.profit >= 0 ? "emerald" : "rose"}
                />
              </div>

              {/* Charts and Risk Assessment */}
              <div className="grid gap-6 xl:grid-cols-2">
                <ChartWidget simulatedYield={result.yield} />
                <div className="space-y-6">
                  <RiskCard result={result} />
                  <CostBreakdownCard inputs={inputs} result={result} />
                </div>
              </div>

              {/* Explainability & Insights */}
              <InsightCard result={result} inputs={inputs} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <div className="mt-1 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-slate-300 [&_input]:p-2.5 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-slate-300 [&_select]:p-2.5">
        {children}
      </div>
    </label>
  );
}

function Range({ label, value, min, max, step = 1, onChange }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <span className="float-right font-bold text-emerald-700">{value} mm</span>
      <input
        className="mt-2 w-full accent-emerald-600"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
      />
    </label>
  );
}

function RiskCard({ result }) {
  const riskColor = result.risk < 35 ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : result.risk < 65 ? 'text-amber-600 border-amber-200 bg-amber-50' : 'text-rose-600 border-rose-200 bg-rose-50';
  
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Composite Risk Assessment</h2>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold border ${riskColor}`}>
          {result.riskLevel} Risk
        </span>
      </div>
      <p className="mt-2 text-3xl font-bold text-slate-900">
        {result.risk}<span className="text-sm font-normal text-slate-500">/100 Index</span>
      </p>

      <div className="mt-4 space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Identified Risk Factors:</p>
        {result.riskFactors && result.riskFactors.length > 0 ? (
          result.riskFactors.map((factor, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
              <span>{factor}</span>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-500">Optimal water supply and favorable financial margins.</p>
        )}
      </div>
    </article>
  );
}

function CostBreakdownCard({ inputs, result }) {
  const irrigationCost = result?.raw?.economics_data?.irrigation_cost || Math.round(inputs.water * 20);
  const data = [
    { name: 'Fertilizer', value: inputs.fertilizer },
    { name: 'Labor', value: inputs.labor },
    { name: 'Irrigation Operating', value: irrigationCost },
    { name: 'Other Inputs', value: inputs.other + 10000 }
  ];
  const colors = ['#059669', '#0284c7', '#3b82f6', '#f59e0b'];

  return (
    <article className="h-80 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-900">Production Cost Breakdown</h2>
      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="45%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </article>
  );
}

function InsightCard({ result, inputs }) {
  return (
    <article className="rounded-xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Why did this outcome happen?</h2>
        <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
          Simulation Reasoning Engine
        </span>
      </div>
      <p className="mt-3 text-slate-800 font-medium leading-relaxed">
        {result.explanation}
      </p>

      <div className="mt-4 pt-4 border-t border-blue-200 flex flex-wrap items-center justify-between text-xs text-slate-600">
        <span>Location: <b>{inputs.location}</b></span>
        <span>Crop: <b>{inputs.crop}</b></span>
        <span>Total Production Cost: <b>₹{result.cost.toLocaleString('en-IN')}</b></span>
        <span>Calculated Revenue: <b>₹{result.revenue.toLocaleString('en-IN')}</b></span>
      </div>
    </article>
  );
}
