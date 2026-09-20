import { createContext, useContext, useState, useEffect } from 'react';
import { fetchScenariosApi, createScenarioApi, duplicateScenarioApi, deleteScenarioApi, runSimulation } from '../services/api';

const ScenarioContext = createContext(null);

export function ScenarioProvider({ children }) {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Load scenarios from backend on startup and re-simulate each to get live results
  useEffect(() => {
    async function loadBackendScenarios() {
      setLoading(true);
      setLoadError(null);
      try {
        const list = await fetchScenariosApi();
        if (list && list.length > 0) {
          const loadedScenarios = await Promise.all(
            list.map(async (sc) => {
              const inputs = {
                location: sc.location?.name || 'Nanded, Maharashtra',
                area: Math.round(((sc.farm_area_ha || 1.0) / 0.404686) * 10) / 10,
                crop: sc.crop ? sc.crop.charAt(0).toUpperCase() + sc.crop.slice(1) : 'Sugarcane',
                plantingDate: sc.planting_date || '2026-06-15',
                water: sc.water?.irrigation || 350,
                irrigation: sc.water?.method ? sc.water.method.charAt(0).toUpperCase() + sc.water.method.slice(1) : 'Drip',
                rainfall: sc.water?.available || 500,
                fertilizer: sc.inputs?.fertilizer_cost || 18000,
                labor: sc.inputs?.labor_cost || 12000,
                other: sc.inputs?.other_cost || 8000,
                price: sc.economics?.market_price || 3100
              };
              // Re-simulate using backend to get current result (avoids stale saved results)
              const result = await runSimulation(inputs);
              return {
                id: sc.id,
                name: sc.name,
                inputs,
                result,
                backendScenario: sc
              };
            })
          );
          setScenarios(loadedScenarios);
        } else {
          // If database is empty, seed two initial scenarios via backend
          const baseInputs = { location: 'Nanded, Maharashtra', area: 2.5, crop: 'sugarcane', plantingDate: '2026-06-15', water: 350, irrigation: 'Drip', rainfall: 500, fertilizer: 18000, labor: 12000, other: 8000, price: 3100 };
          const lowWaterInputs = { location: 'Nanded, Maharashtra', area: 2.5, crop: 'sugarcane', plantingDate: '2026-06-15', water: 150, irrigation: 'Drip', rainfall: 350, fertilizer: 18000, labor: 12000, other: 8000, price: 3100 };

          const baseSc = await createScenarioApi(baseInputs, 'Baseline Sugarcane Plan');
          const lowSc = await createScenarioApi(lowWaterInputs, 'Low Water Scenario');
          setScenarios([baseSc, lowSc]);
        }
      } catch (err) {
        console.error('Could not load backend scenarios:', err);
        setLoadError('Could not connect to simulation backend. Please start the FastAPI server.');
      } finally {
        setLoading(false);
      }
    }

    loadBackendScenarios();
  }, []);

  const saveScenario = async ({ name, inputs, result }) => {
    // Always persist to backend — no silent local fallback
    const created = await createScenarioApi(inputs, name);
    setScenarios((current) => [...current, created]);
    return created;
  };

  const duplicateScenario = async (id, newName) => {
    const parent = scenarios.find((s) => s.id === id);
    if (!parent) throw new Error('Scenario not found');

    // Always duplicate via backend — no silent local fallback
    const cloned = await duplicateScenarioApi(id, newName || `${parent.name} Copy`);
    setScenarios((current) => [...current, cloned]);
    return cloned;
  };

  const deleteScenario = async (id) => {
    await deleteScenarioApi(id);
    setScenarios((current) => current.filter((scenario) => scenario.id !== id));
  };

  return (
    <ScenarioContext.Provider value={{ scenarios, loading, loadError, saveScenario, duplicateScenario, deleteScenario }}>
      {children}
    </ScenarioContext.Provider>
  );
}

export function useScenarios() {
  const context = useContext(ScenarioContext);
  if (!context) throw new Error('useScenarios must be used within ScenarioProvider');
  return context;
}
