const API_BASE_URL = 'http://localhost:8000/api/v1';

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
  // Use backend ROI directly — do not recalculate in frontend
  const roi = data.economics_data?.roi_percentage ?? 0;

  return {
    yield: yieldVal,
    water: waterVal,
    cost: totalCost,
    revenue: revenue,
    profit: profit,
    roi: Math.round(roi),
    // Expose individual cost components from backend
    inputCost: data.economics_data?.input_cost ?? 0,
    irrigationCost: data.economics_data?.irrigation_cost ?? 0,
    laborCost: data.economics_data?.labor_cost ?? 0,
    // Expose potential yield from backend for chart scaling
    potentialYield: data.yield_data?.potential_t_ha ?? 0,
    risk: data.risk_data?.score ?? 0,
    riskLevel: data.risk_data?.level ?? 'Low',
    riskFactors: data.risk_data?.factors || [],
    explanation: data.explanation || null,
    engineUsed: data.engine_used || 'fallback',
    raw: data
  };
}

export async function runSimulation(inputs, signal = null) {
  const payload = formatInputsForBackend(inputs);

  const res = await fetch(`${API_BASE_URL}/simulations/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: signal || undefined
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: `HTTP error ${res.status}` }));
    const message = errData.detail || `HTTP error ${res.status}`;
    throw new Error(message);
  }
  const data = await res.json();
  return mapBackendResultToUI(data);
}

export async function fetchScenariosApi() {
  const res = await fetch(`${API_BASE_URL}/scenarios`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function createScenarioApi(inputs, name) {
  const payload = formatInputsForBackend(inputs, name);
  const res = await fetch(`${API_BASE_URL}/scenarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: `HTTP error ${res.status}` }));
    throw new Error(errData.detail || `HTTP error ${res.status}`);
  }
  const scenarioObj = await res.json();

  // Run simulation on saved scenario and get real backend result
  const simRes = await fetch(`${API_BASE_URL}/scenarios/${scenarioObj.id}/simulate`, { method: 'POST' });
  if (!simRes.ok) {
    const errData = await simRes.json().catch(() => ({ detail: `Simulation error ${simRes.status}` }));
    throw new Error(errData.detail || `Simulation error ${simRes.status}`);
  }
  const simData = await simRes.json();

  return {
    id: scenarioObj.id,
    name: scenarioObj.name,
    inputs: inputs,
    backendScenario: scenarioObj,
    result: mapBackendResultToUI(simData)
  };
}

export async function updateScenarioApi(scenarioId, inputs, name) {
  const payload = formatInputsForBackend(inputs, name);
  const res = await fetch(`${API_BASE_URL}/scenarios/${scenarioId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: `HTTP error ${res.status}` }));
    throw new Error(errData.detail || `HTTP error ${res.status}`);
  }
  return await res.json();
}

export async function duplicateScenarioApi(scenarioId, newName, modifications) {
  const res = await fetch(`${API_BASE_URL}/scenarios/${scenarioId}/duplicate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      new_name: newName,
      modifications: modifications || null
    })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: `HTTP error ${res.status}` }));
    throw new Error(errData.detail || `HTTP error ${res.status}`);
  }
  const scenarioObj = await res.json();

  const simRes = await fetch(`${API_BASE_URL}/scenarios/${scenarioObj.id}/simulate`, { method: 'POST' });
  if (!simRes.ok) {
    const errData = await simRes.json().catch(() => ({ detail: `Simulation error ${simRes.status}` }));
    throw new Error(errData.detail || `Simulation error ${simRes.status}`);
  }
  const simData = await simRes.json();

  return {
    id: scenarioObj.id,
    name: scenarioObj.name,
    inputs: {
      location: scenarioObj.location?.name || 'Nanded, Maharashtra',
      area: Math.round(((scenarioObj.farm_area_ha || 1.0) / 0.404686) * 10) / 10,
      crop: scenarioObj.crop,
      plantingDate: scenarioObj.planting_date,
      water: scenarioObj.water?.irrigation || 350,
      irrigation: scenarioObj.water?.method ? scenarioObj.water.method.charAt(0).toUpperCase() + scenarioObj.water.method.slice(1) : 'Drip',
      rainfall: scenarioObj.water?.available || 500,
      fertilizer: scenarioObj.inputs?.fertilizer_cost || 18000,
      labor: scenarioObj.inputs?.labor_cost || 12000,
      other: scenarioObj.inputs?.other_cost || 8000,
      price: scenarioObj.economics?.market_price || 3100
    },
    backendScenario: scenarioObj,
    result: mapBackendResultToUI(simData)
  };
}

export async function deleteScenarioApi(scenarioId) {
  const res = await fetch(`${API_BASE_URL}/scenarios/${scenarioId}`, { method: 'DELETE' });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: `HTTP error ${res.status}` }));
    throw new Error(errData.detail || `HTTP error ${res.status}`);
  }
  return true;
}

export async function compareScenariosApi(baselineScenario, alternativeScenarios) {
  const payload = {
    baseline_scenario: formatInputsForBackend(baselineScenario.inputs, baselineScenario.name),
    alternative_scenarios: alternativeScenarios.map(sc => formatInputsForBackend(sc.inputs, sc.name))
  };

  const res = await fetch(`${API_BASE_URL}/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: `HTTP error ${res.status}` }));
    throw new Error(errData.detail || `HTTP error ${res.status}`);
  }
  return await res.json();
}

export async function fetchCropsApi() {
  const res = await fetch(`${API_BASE_URL}/crops`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function fetchWeatherLocationsApi() {
  const res = await fetch(`${API_BASE_URL}/weather`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}
