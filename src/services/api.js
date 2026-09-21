const getApiBaseUrl = () => {
  const envUrl = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL) : null;
  if (envUrl) {
    const clean = envUrl.replace(/\/+$/, '');
    return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
  }
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000/api/v1';
    }
  }
  return 'https://few-facts-rescue.loca.lt/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Bypass-Tunnel-Remainder': 'true',
  'bypass-tunnel-reminder': 'true'
};

export function formatInputsForBackend(inputs, name = 'Farming Scenario') {
  return {
    name: name,
    location: {
      name: inputs.location || 'Nanded, Maharashtra',
      lat: 19.13,
      lon: 77.32
    },
    crop: (inputs.crop || 'sugarcane').split(' ')[0].toLowerCase(),
    farm_area_ha: (Number(inputs.area) || 2.5) * 0.404686,
    farm_area_acres: Number(inputs.area) || 2.5,
    planting_date: inputs.plantingDate || '2026-06-15',
    water: {
      available: Number(inputs.rainfall) || 500,
      irrigation: Number(inputs.water) || 350,
      method: (inputs.irrigation || 'drip').toLowerCase()
    },
    inputs: {
      seed_cost: 10000,
      fertilizer_cost: Number(inputs.fertilizer) || 18000,
      labor_cost: Number(inputs.labor) || 12000,
      machinery_cost: 6000,
      other_cost: Number(inputs.other) || 8000
    },
    economics: {
      market_price: Number(inputs.price) || 3100
    }
  };
}

export function mapBackendResultToUI(data) {
  const yieldVal = data.yield_data?.estimated_t_ha ?? 0;
  const waterVal = data.water_data?.consumed_mm ?? 0;
  const totalCost = data.economics_data?.total_cost ?? 0;
  const revenue = data.economics_data?.revenue ?? 0;
  const profit = data.economics_data?.profit ?? 0;
  const roi = data.economics_data?.roi_percentage ?? 0;

  return {
    yield: yieldVal,
    water: waterVal,
    cost: totalCost,
    revenue: revenue,
    profit: profit,
    roi: Math.round(roi),
    inputCost: data.economics_data?.input_cost ?? 0,
    irrigationCost: data.economics_data?.irrigation_cost ?? 0,
    laborCost: data.economics_data?.labor_cost ?? 0,
    potentialYield: data.yield_data?.potential_t_ha ?? 0,
    risk: data.risk_data?.score ?? 0,
    riskLevel: data.risk_data?.level ?? 'Low',
    riskFactors: data.risk_data?.factors || [],
    explanation: data.explanation || null,
    engineUsed: data.engine_used || 'fallback',
    raw: data
  };
}

function computeClientFallbackSimulation(inputs) {
  const areaAcres = Number(inputs.area) || 2.5;
  const waterIrr = Number(inputs.water) || 350;
  const rain = Number(inputs.rainfall) || 500;
  const totalWater = waterIrr + rain;
  const price = Number(inputs.price) || 3100;
  const fert = Number(inputs.fertilizer) || 18000;
  const labor = Number(inputs.labor) || 12000;
  const other = Number(inputs.other) || 8000;

  const yieldVal = +(55.35 * Math.min(1.0, Math.max(0.3, totalWater / 850.0))).toFixed(2);
  const totalTonnes = +(yieldVal * areaAcres * 0.404686).toFixed(2);
  const revenue = Math.round(totalTonnes * price);
  const irrCost = Math.round(waterIrr * 20 * areaAcres * 0.404686);
  const inputCost = fert + labor + 10000 + 6000 + other;
  const totalCost = inputCost + irrCost;
  const profit = revenue - totalCost;
  const roi = totalCost > 0 ? Math.round((profit / totalCost) * 100) : 0;
  const risk = Math.min(90, Math.max(10, Math.round(75 - (totalWater / 850) * 50)));

  return {
    yield: yieldVal,
    water: waterIrr,
    cost: totalCost,
    revenue: revenue,
    profit: profit,
    roi: roi,
    inputCost: inputCost,
    irrigationCost: irrCost,
    laborCost: labor,
    potentialYield: 90.0,
    risk: risk,
    riskLevel: risk < 35 ? 'Low' : risk < 65 ? 'Medium' : 'High',
    riskFactors: ['Water stress impact based on total seasonal moisture'],
    explanation: {
      narrative: `Estimated yield for Sugarcane is ${yieldVal} t/ha with net profit of INR ${profit.toLocaleString()}. Risk score is ${risk} (${risk < 35 ? 'Low' : 'Medium'}).`,
      takeaways: [
        `Water availability (${totalWater} mm) meets approximately ${Math.round((totalWater/850)*100)}% of seasonal demand.`,
        `Net ROI is projected at ${roi}% with total production cost of INR ${totalCost.toLocaleString()}.`
      ],
      not_modeled: []
    },
    engineUsed: 'fallback (client fallback)',
    raw: null
  };
}

export async function runSimulation(inputs, signal = null) {
  const payload = formatInputsForBackend(inputs);

  try {
    const res = await fetch(`${API_BASE_URL}/simulations/run`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(payload),
      signal: signal || undefined
    });

    if (res.ok) {
      const data = await res.json();
      return mapBackendResultToUI(data);
    }
  } catch (err) {
    console.warn('Backend connection issue, serving fallback calculation:', err);
  }

  return computeClientFallbackSimulation(inputs);
}

export async function fetchScenariosApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/scenarios`, { headers: DEFAULT_HEADERS });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Scenarios API unreachable:', err);
  }
  return [];
}

export async function createScenarioApi(inputs, name) {
  const payload = formatInputsForBackend(inputs, name);
  try {
    const res = await fetch(`${API_BASE_URL}/scenarios`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const scenarioObj = await res.json();
      const simRes = await fetch(`${API_BASE_URL}/scenarios/${scenarioObj.id}/simulate`, {
        method: 'POST',
        headers: DEFAULT_HEADERS
      });
      if (simRes.ok) {
        const simData = await simRes.json();
        return {
          id: scenarioObj.id,
          name: scenarioObj.name,
          inputs: inputs,
          backendScenario: scenarioObj,
          result: mapBackendResultToUI(simData)
        };
      }
    }
  } catch (err) {
    console.warn('Create scenario API unreachable, using client scenario state:', err);
  }

  return {
    id: `sc_${Date.now()}`,
    name: name || 'Farming Scenario',
    inputs: inputs,
    backendScenario: null,
    result: computeClientFallbackSimulation(inputs)
  };
}

export async function updateScenarioApi(scenarioId, inputs, name) {
  const payload = formatInputsForBackend(inputs, name);
  try {
    const res = await fetch(`${API_BASE_URL}/scenarios/${scenarioId}`, {
      method: 'PUT',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(payload)
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Update scenario API unreachable:', err);
  }
  return { id: scenarioId, name: name };
}

export async function duplicateScenarioApi(scenarioId, newName, modifications) {
  try {
    const res = await fetch(`${API_BASE_URL}/scenarios/${scenarioId}/duplicate`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        new_name: newName,
        modifications: modifications || null
      })
    });
    if (res.ok) {
      const scenarioObj = await res.json();
      const simRes = await fetch(`${API_BASE_URL}/scenarios/${scenarioObj.id}/simulate`, {
        method: 'POST',
        headers: DEFAULT_HEADERS
      });
      if (simRes.ok) {
        const simData = await simRes.json();
        return {
          id: scenarioObj.id,
          name: scenarioObj.name,
          inputs: modifications ? { ...modifications } : {},
          backendScenario: scenarioObj,
          result: mapBackendResultToUI(simData)
        };
      }
    }
  } catch (err) {
    console.warn('Duplicate scenario API unreachable:', err);
  }
  return {
    id: `dup_${Date.now()}`,
    name: newName,
    inputs: modifications || {},
    backendScenario: null,
    result: computeClientFallbackSimulation(modifications || {})
  };
}

export async function deleteScenarioApi(scenarioId) {
  try {
    const res = await fetch(`${API_BASE_URL}/scenarios/${scenarioId}`, {
      method: 'DELETE',
      headers: DEFAULT_HEADERS
    });
    if (res.ok) return true;
  } catch (err) {
    console.warn('Delete scenario API unreachable:', err);
  }
  return true;
}

export async function compareScenariosApi(baselineScenario, alternativeScenarios) {
  const payload = {
    baseline_scenario: formatInputsForBackend(baselineScenario.inputs, baselineScenario.name),
    alternative_scenarios: alternativeScenarios.map(sc => formatInputsForBackend(sc.inputs, sc.name))
  };

  try {
    const res = await fetch(`${API_BASE_URL}/compare`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(payload)
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Compare scenarios API unreachable:', err);
  }

  // Client-side comparison calculation fallback
  const baseRes = computeClientFallbackSimulation(baselineScenario.inputs);
  const altComparisons = alternativeScenarios.map(sc => {
    const altRes = computeClientFallbackSimulation(sc.inputs);
    const yieldDiff = +(altRes.yield - baseRes.yield).toFixed(2);
    const profitDiff = altRes.profit - baseRes.profit;
    const waterDiff = altRes.water - baseRes.water;

    return {
      scenario_name: sc.name,
      yield: { estimated_t_ha: altRes.yield, delta_from_baseline_t_ha: yieldDiff },
      economics: { profit: altRes.profit, delta_profit_from_baseline: profitDiff },
      water: { consumed_mm: altRes.water, delta_water_from_baseline_mm: waterDiff },
      risk: { score: altRes.risk, level: altRes.riskLevel }
    };
  });

  return {
    baseline_summary: {
      name: baselineScenario.name,
      yield_t_ha: baseRes.yield,
      profit: baseRes.profit,
      water_mm: baseRes.water,
      risk_score: baseRes.risk
    },
    comparisons: altComparisons,
    explanation: {
      summary: `Comparing scenarios against baseline '${baselineScenario.name}'.`,
      key_differences: altComparisons.map(c => `'${c.scenario_name}' yield delta: ${c.yield.delta_from_baseline_t_ha} t/ha, profit delta: INR ${c.economics.delta_profit_from_baseline.toLocaleString()}`)
    },
    dominant_factors: [
      { factor: 'Water Availability', weight_pct: 55 },
      { factor: 'Irrigation Allocation', weight_pct: 45 }
    ]
  };
}

export async function fetchCropsApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/crops`, { headers: DEFAULT_HEADERS });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Crops API unreachable:', err);
  }
  return {
    sugarcane: { name: 'Sugarcane', potential_yield_t_ha: 90.0 },
    wheat: { name: 'Wheat', potential_yield_t_ha: 5.5 },
    soybean: { name: 'Soybean', potential_yield_t_ha: 3.5 },
    maize: { name: 'Maize', potential_yield_t_ha: 8.5 },
    cotton: { name: 'Cotton', potential_yield_t_ha: 2.5 }
  };
}

export async function fetchWeatherLocationsApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/weather`, { headers: DEFAULT_HEADERS });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Weather API unreachable:', err);
  }
  return {
    locations: [
      { id: 'nanded', name: 'Nanded, Maharashtra', lat: 19.13, lon: 77.32, annual_rainfall_mm: 850.0 },
      { id: 'pune', name: 'Pune, Maharashtra', lat: 18.52, lon: 73.85, annual_rainfall_mm: 720.0 },
      { id: 'latur', name: 'Latur, Maharashtra', lat: 18.4, lon: 76.56, annual_rainfall_mm: 700.0 }
    ]
  };
}
