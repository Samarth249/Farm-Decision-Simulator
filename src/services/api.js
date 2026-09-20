const API_BASE_URL = 'http://localhost:8000/api/v1';

export async function runSimulation(inputs) {
  const payload = {
    name: inputs.name || `${inputs.crop || 'Crop'} Scenario`,
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
      explanation: data.explanation || 'Simulation computed via decision engine.',
      engineUsed: data.engine_used,
      raw: data
    };
  } catch (err) {
    console.warn('FastAPI backend offline, using deterministic fallback calculation:', err);
    // Offline deterministic fallback calculation
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
      explanation: 'Simulation computed using fallback calculation mode.',
      engineUsed: 'fallback_client'
    };
  }
}

export async function compareScenariosApi(baseline, alternatives) {
  try {
    const res = await fetch(`${API_BASE_URL}/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseline_scenario: baseline,
        alternative_scenarios: alternatives
      })
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('FastAPI compare API offline:', err);
    return null;
  }
}
