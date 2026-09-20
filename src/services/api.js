const API_BASE_URL = 'http://localhost:8000/api/v1';

export function formatInputsForBackend(inputs, name = 'Scenario') {
  return {
    name: name,
    location: {
      name: inputs.location || 'Nanded, Maharashtra',
      lat: 19.13,
      lon: 77.32
    },
    crop: (inputs.crop || 'sugarcane').toLowerCase(),
    farm_area_ha: (Number(inputs.area) || 2.5) * 0.404686,
    farm_area_acres: Number(inputs.area) || 2.5,
    planting_date: inputs.plantingDate || '2026-06-15',
    water: {
      available: Number(inputs.rainfall) || Number(inputs.water) || 500,
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

export async function runSimulation(inputs) {
  const payload = formatInputsForBackend(inputs);

  try {
    const res = await fetch(`${API_BASE_URL}/simulations/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();

    return {
      yield: data.yield_data.estimated_t_ha,
      water: data.water_data.consumed_mm,
      cost: data.economics_data.total_cost,
      revenue: data.economics_data.revenue,
      profit: data.economics_data.profit,
      risk: data.risk_data.score,
      riskLevel: data.risk_data.level,
      riskFactors: data.risk_data.factors || [],
      explanation: data.explanation || 'Simulation completed via backend engine.',
      engineUsed: data.engine_used,
      raw: data
    };
  } catch (err) {
    console.warn('Backend unavailable, using fallback calculation:', err);
    
    // Offline calculation fallback
    const yieldVal = +(55 + Number(inputs.water) / 40 + Number(inputs.rainfall || 380) / 80).toFixed(1);
    const costVal = Number(inputs.fertilizer || 18000) + Number(inputs.labor || 12000) + Number(inputs.other || 8000) + Math.round(Number(inputs.water) * 20);
    const revVal = Math.round(yieldVal * Number(inputs.area || 2.5) * Number(inputs.price || 3100));
    const profitVal = revVal - costVal;
    const riskVal = Math.min(95, Math.max(15, Math.round(70 - Number(inputs.water) / 20)));

    return {
      yield: yieldVal,
      water: Math.round(Number(inputs.water)),
      cost: costVal,
      revenue: revVal,
      profit: profitVal,
      risk: riskVal,
      riskLevel: riskVal < 35 ? 'Low' : riskVal < 65 ? 'Medium' : 'High',
      riskFactors: ['Fallback estimation mode'],
      explanation: 'Simulation computed using client-side fallback calculation.',
      engineUsed: 'fallback',
      raw: null
    };
  }
}

export async function compareScenariosApi(baselineScenario, alternativeScenarios) {
  try {
    const payload = {
      baseline_scenario: formatInputsForBackend(baselineScenario.inputs, baselineScenario.name),
      alternative_scenarios: alternativeScenarios.map(sc => formatInputsForBackend(sc.inputs, sc.name))
    };

    const res = await fetch(`${API_BASE_URL}/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend compare endpoint unavailable:', err);
    return null;
  }
}

export async function fetchCropsApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/crops`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function fetchWeatherLocationsApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/weather`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return null;
  }
}
