import { createContext, useContext, useState } from 'react';

const ScenarioContext = createContext(null);
const seeds = [
  { id: 'baseline', name: 'Baseline Sugarcane Plan', inputs: { location: 'Nanded, Maharashtra', area: 2.5, crop: 'Sugarcane', water: 850, rainfall: 420, temperature: 29 }, result: { yield: 86.2, water: 640, cost: 118000, revenue: 189640, profit: 71640, risk: 28, riskLevel: 'Low', explanation: 'Adequate drip irrigation and expected monsoon rainfall support a stable sugarcane yield.' } },
  { id: 'low-water', name: 'Low Water Scenario', inputs: { location: 'Nanded, Maharashtra', area: 2.5, crop: 'Sugarcane', water: 610, rainfall: 300, temperature: 32 }, result: { yield: 74.5, water: 510, cost: 104000, revenue: 163900, profit: 59900, risk: 58, riskLevel: 'Medium', explanation: 'Reduced water availability increases water-stress exposure during crop growth.' } },
];
export function ScenarioProvider({ children }) { const [scenarios, setScenarios] = useState(seeds); const saveScenario = (scenario) => setScenarios((current) => [...current, { ...scenario, id: crypto.randomUUID() }]); const deleteScenario = (id) => setScenarios((current) => current.filter((scenario) => scenario.id !== id)); return <ScenarioContext.Provider value={{ scenarios, saveScenario, deleteScenario }}>{children}</ScenarioContext.Provider>; }
export function useScenarios() { const context = useContext(ScenarioContext); if (!context) throw new Error('useScenarios must be used within ScenarioProvider'); return context; }
